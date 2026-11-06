import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { CatLoader } from "./CatLoader";
import { FileText, ImageIcon, Ellipsis } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import { formatEventDate } from "@/presentation/medicalEvents";
import { Image } from "expo-image";
import type { MedicalAttachment } from "@/types/domain";
import {
  downloadAttachment,
  freshAttachmentUrl,
  openPdf,
  shareAttachment,
} from "@/platform/files";
import { Button, Card, ErrorText, T } from "./ui";
import { t, intlLocale } from "@/i18n";
export function AttachmentRow({
  attachment,
  compact = false,
  eventTitle,
  eventDate,
}: {
  attachment: MedicalAttachment;
  compact?: boolean;
  eventTitle?: string;
  eventDate?: string;
}) {
  const { colors } = useSettings();
  const [preview, setPreview] = useState<string>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  async function work(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const openImage = async () => {
    const url = await freshAttachmentUrl(attachment);
    setPreviewLoading(true);
    setPreview(url);
  };
  const open = () =>
    void work(async () => {
      if (attachment.mediaType.startsWith("image/")) await openImage();
      else await openPdf(attachment);
    });
  const Icon = attachment.mediaType.startsWith("image/") ? ImageIcon : FileText;
  const Wrapper = compact ? View : Card;
  return (
    <Wrapper>
      {compact ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 16,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("Открыть")}: ${attachment.fileName}`}
              disabled={busy}
              onPress={open}
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: busy ? "transparent" : colors.soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {busy ? (
                  <CatLoader size={44} />
                ) : (
                  <Icon size={22} color={colors.text} />
                )}
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <T
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    fontFamily: "Manrope_700Bold",
                  }}
                >
                  {attachment.fileName}
                </T>
                <T
                  style={{ fontSize: 11, lineHeight: 15, color: colors.muted }}
                >
                  {attachment.fileName.split(".").pop()?.toUpperCase()} ·{" "}
                  {new Intl.NumberFormat(intlLocale.value, {
                    maximumFractionDigits: 1,
                  }).format(
                    attachment.sizeBytes < 1048576
                      ? attachment.sizeBytes / 1024
                      : attachment.sizeBytes / 1048576,
                  )}{" "}
                  {t(attachment.sizeBytes < 1048576 ? "КБ" : "МБ")}
                </T>
                {eventTitle || eventDate ? (
                  <T
                    style={{
                      fontSize: 11,
                      lineHeight: 15,
                      color: colors.muted,
                    }}
                  >
                    {eventTitle}
                    {eventDate ? ` · ${formatEventDate(eventDate)}` : ""}
                  </T>
                ) : null}
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t("Действия с документом")}: ${attachment.fileName}`}
              disabled={busy}
              onPress={() =>
                Alert.alert(attachment.fileName, undefined, [
                  {
                    text: t("Скачать"),
                    onPress: () =>
                      void work(async () => {
                        await downloadAttachment(attachment);
                        Alert.alert(
                          t("Файл сохранён"),
                          t("Документ доступен через системное меню отправки."),
                        );
                      }),
                  },
                  {
                    text: t("Отправить"),
                    onPress: () => void work(() => shareAttachment(attachment)),
                  },
                  { text: t("Отмена"), style: "cancel" },
                ])
              }
              style={{
                width: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ellipsis size={20} color={colors.text} />
            </Pressable>
          </View>
          <ErrorText error={error} />
        </View>
      ) : (
        <>
          <T>{attachment.fileName}</T>
          <T>{(attachment.sizeBytes / 1024 / 1024).toFixed(1)} MB</T>
          <View style={{ height: 32, justifyContent: "center" }}>
            {busy ? <CatLoader /> : null}
          </View>
          <Button
            secondary
            disabled={busy}
            title={t("Открыть")}
            onPress={() => {
              void work(async () => {
                if (attachment.mediaType.startsWith("image/"))
                  await openImage();
                else await openPdf(attachment);
              });
            }}
          />
          <Button
            secondary
            disabled={busy}
            title={t("Скачать")}
            onPress={() => {
              void work(async () => {
                await downloadAttachment(attachment);
                Alert.alert(
                  t("Файл сохранён"),
                  t("Документ доступен через системное меню отправки."),
                );
              });
            }}
          />
          <Button
            secondary
            disabled={busy}
            title={t("Отправить")}
            onPress={() => {
              void work(() => shareAttachment(attachment));
            }}
          />
          <ErrorText error={error} />
        </>
      )}
      <Modal
        visible={Boolean(preview)}
        animationType="fade"
        onRequestClose={() => setPreview(undefined)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            paddingTop: 60,
            paddingBottom: 30,
            paddingHorizontal: 20,
            gap: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Image
              source={preview}
              contentFit="contain"
              style={{ flex: 1 }}
              accessibilityLabel={attachment.fileName}
              onLoadEnd={() => setPreviewLoading(false)}
              onError={() => {
                setPreviewLoading(false);
                setPreview(undefined);
                setError("FILE_LINK");
              }}
            />
            {previewLoading ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <CatLoader />
              </View>
            ) : null}
          </View>
          <Button
            secondary
            title={t("Закрыть")}
            onPress={() => setPreview(undefined)}
          />
        </View>
      </Modal>
    </Wrapper>
  );
}
