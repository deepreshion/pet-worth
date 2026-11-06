import { MedicalEventIcon } from "./MedicalEventIcon";
import { useNotice } from "@/providers/Notices";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Switch, View } from "react-native";
import { Bell, Check, FileText, Paperclip, Plus, X } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import { requestReminderPermission } from "@/platform/reminderPermission";
import { PetAvatar } from "./design";
import { FormLayout, DiscardChanges } from "./FormLayout";
import { EventDateField } from "./EventDateField";

import { useForm, useWatch } from "react-hook-form";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import type {
  MedicalEvent,
  MedicalEventType,
  PetSummary,
  UploadAsset,
} from "@/types/domain";
import { useSaveEvent } from "@/hooks/queries";
import { medicalEventMeta } from "@/presentation/medicalEvents";
import { errorMessage } from "@/presentation/errors";
import {
  isReminderEligible,
  reminderScheduledAt,
  localDateString,
  validateMedicalFiles,
} from "@/utils/medicalEvents";
import { pickDocuments } from "@/platform/files";
import { intlLocale, t } from "@/i18n";
import { Button, Field, T, useUnsavedChanges } from "./ui";
import { DateField } from "./DateField";
interface Values {
  title: string;
  notes: string;
  eventDate: string;
  eventTime: string;
  type: MedicalEventType;
  reminder: boolean;
}
export function MedicalEventForm({
  pet,
  event,
  timezone,
}: {
  pet: PetSummary;
  event?: MedicalEvent;
  timezone: string;
}) {
  const { colors } = useSettings();
  const scroll = useRef<import("react-native").ScrollViewInstance>(null);
  const [noteOpen, setNoteOpen] = useState(Boolean(event?.notes));
  const [filesOpen, setFilesOpen] = useState(
    Boolean(event?.attachments.length),
  );
  const [picking, setPicking] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const form = useForm<Values>({
    defaultValues: {
      title: event?.title ?? "",
      notes: event?.notes ?? "",
      eventDate: event?.eventDate ?? localDateString(),
      eventTime: event?.eventTime ?? "10:00",
      type: event?.type ?? "vaccination",
      reminder: Boolean(event?.reminder && event.eventDate > localDateString()),
    },
  });
  const v = useWatch({ control: form.control }) as Values;
  const notify = useNotice();
  const [files, setFiles] = useState<UploadAsset[]>([]);
  const [retained, setRetained] = useState(event?.attachments ?? []);
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState<string>();
  const mutation = useSaveEvent();
  const busy = useRef(false);
  const requestId = useRef(randomUUID());
  const effectiveTimezone =
    event &&
    event.eventDate === v.eventDate &&
    event.eventTime === (v.reminder ? v.eventTime : null)
      ? event.eventTimezone
      : timezone;
  useUnsavedChanges(
    !saved &&
      (form.formState.isDirty ||
        files.length > 0 ||
        retained.length !== (event?.attachments.length ?? 0)),
    (discard) => {
      if (!busy.current) setDiscardAction(() => discard);
    },
  );
  useEffect(() => {
    if (saved)
      router.replace({
        pathname: "/medical-events/[id]",
        params: { id: saved, saved: "1" },
      });
  }, [saved]);
  async function pick() {
    if (picking || busy.current) return;
    setPicking(true);
    try {
      const incoming = await pickDocuments();
      const issue = validateMedicalFiles([...files, ...incoming]);
      if (issue) throw new Error(issue);
      setFiles((old) => [...old, ...incoming]);
      setFilesOpen(true);
    } catch (e) {
      setError(e);
    } finally {
      setPicking(false);
    }
  }
  const save = async () => {
    const values = form.getValues();
    if (busy.current) return;
    form.clearErrors();
    if (!values.title.trim()) {
      form.setError("title", { message: "TITLE_REQUIRED" });
      scroll.current?.scrollTo({ y: 0, animated: true });
      form.setFocus("title");
      return;
    }
    if (
      values.reminder &&
      !isReminderEligible(
        values.eventDate,
        values.eventTime,
        new Date(),
        effectiveTimezone,
      )
    ) {
      setError("REMINDER_TOO_SOON");
      return;
    }
    const issue = validateMedicalFiles(files);
    if (issue) {
      setError(issue);
      return;
    }
    busy.current = true;
    setError(undefined);
    try {
      const result = await mutation.mutateAsync({
        id: event?.id,
        petId: pet.id,
        requestId: requestId.current,
        type: values.type,
        title: values.title.trim(),
        notes: values.notes,
        eventDate: values.eventDate,
        eventTime: values.eventTime,
        eventTimezone: effectiveTimezone,
        reminderEnabled: values.reminder,
        files,
        retainedAttachmentIds: retained.map((a) => a.id),
      });
      const warnings = [
        ...result.attachmentWarnings,
        ...result.cleanupWarnings,
        ...(result.reminderWarning ? ["NOTIFICATION_SCHEDULE_FAILED"] : []),
      ];
      if (warnings.length)
        notify?.([...new Set(warnings)].map(errorMessage).join("\n"));
      setSaved(result.eventId);
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
    }
  };
  const disabled = mutation.isPending || Boolean(saved);
  const showReminder = v.eventDate > localDateString();
  const eligible = isReminderEligible(
    v.eventDate,
    v.eventTime,
    new Date(),
    effectiveTimezone,
  );
  const set = (key: keyof Values, value: Values[keyof Values]) =>
    form.setValue(key, value, { shouldDirty: true });
  const updateWhen = (key: "eventDate" | "eventTime", value: string) => {
    set(key, value);
    if (key === "eventDate") {
      if (value <= localDateString()) {
        set("reminder", false);
        setDenied(false);
      } else if (!showReminder) {
        set("reminder", true);
      }
    }
  };
  const reminderText =
    v.reminder && eligible
      ? reminderScheduledAt(
          v.eventDate,
          v.eventTime,
          effectiveTimezone,
        ).toLocaleString(intlLocale.value, {
          timeZone: effectiveTimezone,
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
  const fileRow = (
    key: string,
    name: string,
    size: number,
    remove: () => void,
  ) => (
    <View
      key={key}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: colors.surface,
      }}
    >
      <FileText size={22} color={colors.text} />
      <View style={{ flex: 1 }}>
        <T style={{ fontSize: 12 }}>{name}</T>
        <T style={{ fontSize: 11, color: colors.muted }}>
          {(size / 1048576).toFixed(1)} {t("МБ")}
        </T>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t("Убрать")}: ${name}`}
        disabled={disabled}
        onPress={remove}
        style={{
          minWidth: 44,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
  return (
    <>
      <FormLayout
        close
        title={event ? t("Редактировать событие") : t("Новое событие")}
        busy={disabled}
        scrollRef={scroll}
        footer={
          <View style={{ gap: 12 }}>
            {error ? (
              <View
                accessibilityRole="alert"
                style={{
                  padding: 14,
                  gap: 4,
                  borderRadius: 14,
                  backgroundColor: colors.soft,
                }}
              >
                <T
                  style={{
                    color: colors.danger,
                    fontFamily: "Manrope_700Bold",
                  }}
                >
                  {t("Не удалось сохранить")}
                </T>
                <T style={{ color: colors.danger, fontSize: 12 }}>
                  {errorMessage(error)}
                </T>
              </View>
            ) : null}
            <Button
              title={
                mutation.isPending
                  ? t("Сохраняем…")
                  : error
                    ? t("Попробовать снова")
                    : t("Сохранить событие")
              }
              disabled={disabled || picking || permissionBusy}
              icon={<Check size={20} color={colors.onAction} />}
              onPress={() => void save()}
            />
          </View>
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <PetAvatar pet={pet} size={36} />
          <T>{pet.name}</T>
        </View>
        <View style={{ gap: 8 }}>
          <T style={{ fontSize: 13 }}>{t("Тип события")}</T>
          {[
            ["vaccination", "vet_visit"] as const,
            ["analysis", "procedure"] as const,
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8 }}>
              {row.map((type) => {
                return (
                  <Pressable
                    key={type}
                    accessibilityRole="radio"
                    accessibilityLabel={medicalEventMeta[type].label}
                    accessibilityState={{ checked: v.type === type }}
                    disabled={disabled}
                    onPress={() => set("type", type)}
                    style={{
                      flex: 1,
                      minHeight: 54,
                      padding: 12,
                      borderWidth: 1,
                      borderColor:
                        v.type === type ? colors.text : colors.border,
                      borderRadius: 16,
                      backgroundColor:
                        v.type === type ? colors.soft : colors.surface,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MedicalEventIcon
                      type={type}
                      size={18}
                      color={colors.text}
                    />
                    <T style={{ fontSize: 12, flexShrink: 1 }}>
                      {type === "procedure"
                        ? t("Процедура")
                        : medicalEventMeta[type].label}
                    </T>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <Field
          control={form.control}
          name="title"
          error={
            form.formState.errors.title?.message
              ? errorMessage(form.formState.errors.title.message)
              : undefined
          }
          label={t("Название события")}
          placeholder={t("Например, ежегодная вакцинация")}
          maxLength={120}
          editable={!disabled}
        />
        <EventDateField
          value={v.eventDate}
          disabled={disabled}
          onChange={(value) => updateWhen("eventDate", value)}
        />
        {showReminder && v.reminder ? (
          <DateField
            mode="time"
            label={t("Время события")}
            value={v.eventTime}
            disabled={disabled}
            onChange={(value) => updateWhen("eventTime", value)}
          />
        ) : null}
        {showReminder ? (
          <>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Bell size={21} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 13 }}>{t("Напомнить за 24 часа")}</T>
                <T
                  style={{ fontSize: 11, lineHeight: 17, color: colors.muted }}
                >
                  {v.reminder
                    ? eligible
                      ? `${reminderText} · ${effectiveTimezone}`
                      : errorMessage("REMINDER_TOO_SOON")
                    : t("Для событий в будущем")}
                </T>
              </View>
              <Switch
                accessibilityLabel={t("Напомнить за 24 часа")}
                disabled={disabled || permissionBusy}
                value={v.reminder}
                trackColor={{ false: colors.border, true: colors.action }}
                onValueChange={(value) => {
                  if (!value) {
                    set("reminder", false);
                    return;
                  }
                  setPermissionBusy(true);
                  void requestReminderPermission()
                    .then((allowed) => {
                      setDenied(!allowed);
                      if (
                        allowed &&
                        form.getValues("eventDate") > localDateString()
                      )
                        set("reminder", true);
                    })
                    .catch(setError)
                    .finally(() => setPermissionBusy(false));
                }}
              />
            </View>
            {denied ? (
              <View style={{ gap: 8 }}>
                <T>{t("Уведомления выключены")}</T>
                <Button
                  secondary
                  title={t("Открыть настройки")}
                  onPress={() => {
                    void Linking.openSettings().catch(setError);
                  }}
                />
              </View>
            ) : null}
          </>
        ) : null}
        <View style={{ gap: 8 }}>
          {noteOpen ? (
            <Field
              control={form.control}
              name="notes"
              label={t("Заметка")}
              placeholder={t("Необязательно")}
              multiline
              maxLength={10000}
              editable={!disabled}
              style={{ minHeight: 110, textAlignVertical: "top" }}
            />
          ) : (
            <ExpandRow
              title={t("Добавить заметку")}
              Icon={FileText}
              disabled={disabled}
              onPress={() => setNoteOpen(true)}
            />
          )}
          <ExpandRow
            title={t("Добавить фото или PDF")}
            Icon={Paperclip}
            disabled={disabled || picking}
            expanded={filesOpen}
            onPress={() => {
              setFilesOpen(true);
              void pick();
            }}
          />
          {filesOpen ? (
            <>
              {retained.map((a) =>
                fileRow(a.id, a.fileName, a.sizeBytes, () =>
                  setRetained((old) => old.filter((x) => x.id !== a.id)),
                ),
              )}
              {files.map((a, i) =>
                fileRow(`${a.uri}-${i}`, a.name, a.size, () =>
                  setFiles((old) => old.filter((_, index) => index !== i)),
                ),
              )}
              <T style={{ color: colors.muted, fontSize: 11 }}>
                {t("Фото или PDF, до 20 МБ каждый.")}
              </T>
            </>
          ) : null}
        </View>
      </FormLayout>
      <DiscardChanges
        action={discardAction}
        onClose={() => setDiscardAction(null)}
        description={t("Введённые данные и выбранные файлы не сохранятся.")}
      />
    </>
  );
}

function ExpandRow({
  title,
  Icon,
  disabled,
  onPress,
  expanded = false,
}: {
  title: string;
  Icon: typeof Plus;
  disabled?: boolean;
  onPress(): void;
  expanded?: boolean;
}) {
  const { colors } = useSettings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 48,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Icon size={19} color={colors.muted} />
      <T style={{ flex: 1, fontSize: 13 }}>{title}</T>
      <Plus size={18} color={colors.muted} />
    </Pressable>
  );
}
