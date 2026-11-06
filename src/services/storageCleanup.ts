import { supabase } from "@/lib/supabase";

export async function reconcileStorageCleanup(): Promise<string[]> {
  const warnings: string[] = [];
  const { data, error } = await supabase
    .from("storage_cleanup_outbox")
    .select("id,bucket_id,object_path")
    .order("created_at");
  if (error) return ["STORAGE_CLEANUP_READ_FAILED"];
  for (const item of data ?? []) {
    const removal = await supabase.storage
      .from(item.bucket_id)
      .remove([item.object_path]);
    if (removal.error) {
      warnings.push("STORAGE_DELETE_FAILED");
      continue;
    }
    const ack = await supabase.rpc("ack_storage_cleanup", {
      p_outbox_id: item.id,
    });
    if (ack.error || ack.data !== true)
      warnings.push("STORAGE_CLEANUP_ACK_FAILED");
  }
  return warnings;
}
