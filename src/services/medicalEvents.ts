import { readUpload } from "@/platform/files";
import { supabase } from "@/lib/supabase";
import { getCurrentProfile } from "@/services/profile";
import type { Json } from "@/types/database";
import type {
  MedicalEvent,
  SaveMedicalEventInput,
  SaveMedicalEventResult,
} from "@/types/domain";
import {
  cancelEventNotification,
  scheduleEventNotification,
} from "@/services/notifications";
import {
  deterministicAttachmentId,
  isReminderEligible,
  stableNotificationId,
} from "@/utils/medicalEvents";
import { reconcileStorageCleanup } from "@/services/storageCleanup";

interface ReminderRow {
  id: string;
  event_id: string;
  scheduled_at: string;
  notification_id: number;
}

interface EventRow {
  id: string;
  pet_id: string;
  created_by: string;
  type: MedicalEvent["type"];
  title: string;
  notes: string | null;
  event_date: string;
  event_time: string | null;
  event_timezone: string;
  created_at: string;
  updated_at: string;
  pets: { family_id: string; name: string; photo_path: string | null } | null;
  medical_attachments: {
    id: string;
    event_id: string;
    storage_path: string;
    file_name: string;
    media_type: string;
    size_bytes: number;
  }[];
  reminders: ReminderRow | ReminderRow[] | null;
}

const eventSelect = `id, pet_id, created_by, type, title, notes, event_date, event_time, event_timezone, created_at, updated_at,
  pets(family_id, name, photo_path), medical_attachments(id, event_id, storage_path, file_name, media_type, size_bytes),
  reminders(id, event_id, scheduled_at, notification_id)`;

async function getEditableFamilyIds() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    throw userError ?? new Error("AUTH_REQUIRED");
  const { data, error } = await supabase
    .from("family_memberships")
    .select("family_id")
    .eq("user_id", userData.user.id)
    .in("role", ["owner", "member"]);
  if (error) throw error;
  return new Set((data ?? []).map((item) => item.family_id));
}

async function mapEvent(
  row: EventRow,
  canEdit: boolean,
): Promise<MedicalEvent> {
  const reminder = Array.isArray(row.reminders)
    ? row.reminders[0]
    : row.reminders;
  return {
    id: row.id,
    petId: row.pet_id,
    familyId: row.pets?.family_id ?? "",
    petName: row.pets?.name ?? "",
    petPhotoUrl: null,
    createdBy: row.created_by,
    type: row.type,
    title: row.title,
    notes: row.notes,
    eventDate: row.event_date,
    eventTime: row.event_time?.slice(0, 5) ?? null,
    eventTimezone: row.event_timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canEdit,
    attachments: (row.medical_attachments ?? []).map((item) => ({
      id: item.id,
      eventId: item.event_id,
      storagePath: item.storage_path,
      fileName: item.file_name,
      mediaType: item.media_type,
      sizeBytes: item.size_bytes,
    })),
    reminder: reminder
      ? {
          id: reminder.id,
          eventId: reminder.event_id,
          scheduledAt: reminder.scheduled_at,
          notificationId: reminder.notification_id,
        }
      : null,
  };
}

export async function listMedicalEvents(
  petId?: string,
): Promise<MedicalEvent[]> {
  const editableFamilies = await getEditableFamilyIds();
  const rows: EventRow[] = [];
  for (let page = 0; ; page++) {
    let query = supabase
      .from("medical_events")
      .select(eventSelect)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id");
    if (petId) query = query.eq("pet_id", petId);
    const { data, error } = await query.range(page * 500, page * 500 + 499);
    if (error) throw error;
    rows.push(...(data as unknown as EventRow[]));
    if (data.length < 500) break;
  }
  return Promise.all(
    rows.map((row) =>
      mapEvent(row, editableFamilies.has(row.pets?.family_id ?? "")),
    ),
  );
}

export async function getMedicalEvent(id: string): Promise<MedicalEvent> {
  const [{ data, error }, editableFamilies] = await Promise.all([
    supabase.from("medical_events").select(eventSelect).eq("id", id).single(),
    getEditableFamilyIds(),
  ]);
  if (error) throw error;
  const row = data as unknown as EventRow;
  return mapEvent(row, editableFamilies.has(row.pets?.family_id ?? ""));
}

function safeFileName(name: string) {
  return (
    name
      .replaceAll("/", "_")
      .replaceAll("\\", "_")
      .replace(/[^\p{L}\p{N}._ -]/gu, "_")
      .slice(0, 180) || "attachment"
  );
}

async function removeObjectsBestEffort(paths: string[], warnings: string[]) {
  if (!paths.length) return;
  const { error } = await supabase.storage
    .from("medical-attachments")
    .remove(paths);
  if (error) warnings.push("STORAGE_CLEANUP_FAILED");
}

export async function saveMedicalEvent(
  input: SaveMedicalEventInput,
): Promise<SaveMedicalEventResult> {
  const profile = await getCurrentProfile();
  const timezone = input.eventTimezone ?? profile.timezone;
  if (
    input.reminderEnabled &&
    !isReminderEligible(
      input.eventDate,
      input.eventTime || "10:00",
      new Date(),
      timezone,
    )
  ) {
    throw new Error("REMINDER_TOO_SOON");
  }
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("family_id, name")
    .eq("id", input.petId)
    .single();
  if (petError) throw petError;
  const eventId = input.id ?? input.requestId;
  const notificationId = stableNotificationId(eventId);
  const uploadedThisAttempt: string[] = [];
  const newAttachments: Record<string, Json>[] = [];
  let rpcResult: {
    event_id: string;
    reminder_notification_id: number | null;
    reminder_scheduled_at: string | null;
  };
  let rpcStarted = false;

  try {
    for (const [index, file] of input.files.entries()) {
      const attachmentId = deterministicAttachmentId(input.requestId, index);
      const fileName = safeFileName(file.name);
      const path = `${pet.family_id}/${eventId}/${attachmentId}/${fileName}`;
      const { data: existingMetadata, error: metadataError } = await supabase
        .from("medical_attachments")
        .select("id")
        .eq("storage_path", path)
        .maybeSingle();
      if (metadataError) throw metadataError;
      if (!existingMetadata) {
        const upload = await supabase.storage
          .from("medical-attachments")
          .upload(path, await readUpload(file), {
            contentType: file.mimeType,
            upsert: false,
          });
        if (
          upload.error &&
          !upload.error.message.toLowerCase().includes("exist")
        )
          throw upload.error;
        if (!upload.error) uploadedThisAttempt.push(path);
      }
      newAttachments.push({
        id: attachmentId,
        storage_path: path,
        file_name: fileName,
        media_type: file.mimeType,
        size_bytes: file.size,
      });
    }

    rpcStarted = true;
    const rpcArgs = {
      p_event_id: eventId,
      p_pet_id: input.petId,
      p_request_id: input.requestId,
      p_type: input.type,
      p_title: input.title.trim(),
      p_notes: input.notes?.trim() || "",
      p_event_date: input.eventDate,
      p_event_time: input.reminderEnabled ? input.eventTime || "10:00" : null,
      p_event_timezone: timezone,
      p_reminder_enabled: input.reminderEnabled,
      p_notification_id: input.reminderEnabled ? notificationId : null,
      p_new_attachments: newAttachments as Json,
      p_retained_attachment_ids: input.retainedAttachmentIds ?? [],
    };
    const firstAttempt = await supabase
      .rpc("save_medical_event", rpcArgs)
      .single();
    if (!firstAttempt.error && firstAttempt.data?.event_id)
      rpcResult = firstAttempt.data;
    else {
      // A Postgres error proves the transaction rolled back; a transport error does
      // not. Only the latter is retried with the exact same, server-idempotent payload.
      if (
        firstAttempt.error &&
        "code" in firstAttempt.error &&
        firstAttempt.error.code
      ) {
        await removeObjectsBestEffort(uploadedThisAttempt, []);
        throw firstAttempt.error;
      }
      const retry = await supabase.rpc("save_medical_event", rpcArgs).single();
      if (retry.error || !retry.data?.event_id)
        throw (
          firstAttempt.error ??
          retry.error ??
          new Error("EVENT_SAVE_UNCONFIRMED")
        );
      rpcResult = retry.data;
    }

    const cleanupWarnings = await reconcileStorageCleanup();
    let reminderWarning = false;
    try {
      if (
        rpcResult.reminder_notification_id &&
        rpcResult.reminder_scheduled_at
      ) {
        const notification = await scheduleEventNotification({
          id: rpcResult.reminder_notification_id,
          eventId: rpcResult.event_id,
          petName: pet.name,
          title: input.title.trim(),
          at: new Date(rpcResult.reminder_scheduled_at),
        });
        reminderWarning = notification.denied;
      } else await cancelEventNotification(notificationId);
    } catch {
      reminderWarning = Boolean(rpcResult.reminder_notification_id);
      cleanupWarnings.push(
        rpcResult.reminder_notification_id
          ? "NOTIFICATION_SCHEDULE_FAILED"
          : "NOTIFICATION_CANCEL_FAILED",
      );
    }
    return {
      eventId: rpcResult.event_id,
      reminderWarning,
      attachmentWarnings: [],
      cleanupWarnings,
    };
  } catch (error) {
    if (!rpcStarted) await removeObjectsBestEffort(uploadedThisAttempt, []);
    // After an ambiguous transport failure uploads stay intact: a later retry with
    // the same request and deterministic ids can safely complete the transaction.
    throw error;
  }
}

export async function deleteMedicalEvent(
  id: string,
): Promise<{ cleanupWarnings: string[] }> {
  const { data, error } = await supabase
    .rpc("delete_medical_event", { p_event_id: id })
    .single();
  if (error || !data) throw error ?? new Error("EVENT_DELETE_UNCONFIRMED");
  const { data: stillExists, error: verifyError } = await supabase
    .from("medical_events")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (verifyError || stillExists)
    throw verifyError ?? new Error("EVENT_DELETE_NOT_APPLIED");
  const cleanupWarnings: string[] = [];
  if (data.reminder_notification_id) {
    try {
      await cancelEventNotification(data.reminder_notification_id);
    } catch {
      cleanupWarnings.push("NOTIFICATION_CANCEL_FAILED");
    }
  }
  cleanupWarnings.push(...(await reconcileStorageCleanup()));
  return { cleanupWarnings };
}
