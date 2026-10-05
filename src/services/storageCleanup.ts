import { t } from '@/i18n'
import { isDemoMode } from '@/lib/demo'
import { supabase } from '@/lib/supabase'

export async function reconcileStorageCleanup(): Promise<string[]> {
  if (isDemoMode()) return []
  const warnings: string[] = []
  const { data, error } = await supabase.from('storage_cleanup_outbox').select('id,bucket_id,object_path').order('created_at')
  if (error) return [t('Не удалось проверить очередь очистки вложений.')]
  for (const item of data ?? []) {
    const removal = await supabase.storage.from(item.bucket_id).remove([item.object_path])
    if (removal.error) { warnings.push(t('Не удалось удалить файл {path}.', { path: item.object_path })); continue }
    const ack = await supabase.rpc('ack_storage_cleanup', { p_outbox_id: item.id })
    if (ack.error || ack.data !== true) warnings.push(t('Не удалось подтвердить очистку файла {path}.', { path: item.object_path }))
  }
  return warnings
}
