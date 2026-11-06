import { useNotice } from "@/providers/Notices";
import { useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useDeleteEvent, useEvent } from "@/hooks/queries";
import { useSettings } from "@/providers/Settings";
import {
  EventDetailSkeleton,
  EventDetailFooterSkeleton,
} from "@/components/EventDetailSkeleton";
import { AttachmentRow } from "@/components/AttachmentRow";
import { IconButton } from "@/components/design";
import {
  Button,
  ErrorText,
  QueryState,
  Screen,
  T,
  styles,
} from "@/components/ui";
import {
  medicalEventMeta,
  formatEventDate,
} from "@/presentation/medicalEvents";
import { errorMessage } from "@/presentation/errors";
import { intlLocale, t } from "@/i18n";
export default function EventDetail() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const [showSaved, setShowSaved] = useState(saved === "1");
  useEffect(() => {
    if (saved !== "1") return;
    const timer = setTimeout(() => setShowSaved(false), 5000);
    return () => clearTimeout(timer);
  }, [saved]);
  const query = useEvent(id);
  const remove = useDeleteEvent();
  const notify = useNotice();
  const { colors } = useSettings();
  const [error, setError] = useState<unknown>();
  const event = query.data;
  async function destroy() {
    if (remove.isPending) return;
    try {
      const result = await remove.mutateAsync(id);
      if (result.cleanupWarnings.length)
        notify?.(result.cleanupWarnings.map(errorMessage).join("\n"));
      router.replace(`/pets/${event!.petId}`);
    } catch (e) {
      setError(e);
    }
  }
  const badge = (Icon: typeof Bell, title: string, subtitle: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: colors.soft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={21} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: "Manrope_600SemiBold", fontSize: 13 }}>
          {title}
        </T>
        <T style={{ color: colors.muted, fontSize: 12 }}>{subtitle}</T>
      </View>
    </View>
  );
  return (
    <Screen
      topSafe
      scroll={false}
      header={
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingVertical: 6,
            gap: 12,
          }}
        >
          <IconButton
            label={t("Назад")}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace(event ? `/pets/${event.petId}` : "/pets");
            }}
          >
            <ChevronLeft size={20} color={colors.text} />
          </IconButton>
          <T
            accessibilityRole="header"
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "Manrope_700Bold",
              fontSize: 16,
            }}
          >
            {t("Событие")}
          </T>
          {event?.canEdit ? (
            <IconButton
              label={t("Редактировать событие")}
              onPress={() => router.push(`/medical-events/${id}/edit`)}
            >
              <Pencil size={19} color={colors.text} />
            </IconButton>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
      }
      footer={
        query.isPending ? (
          <EventDetailFooterSkeleton />
        ) : event ? (
          <Button
            title={t("К событиям {name}", { name: event.petName })}
            icon={<ArrowRight size={21} color={colors.onAction} />}
            onPress={() => router.replace(`/pets/${event.petId}`)}
          />
        ) : undefined
      }
    >
      {query.isPending ? (
        <EventDetailSkeleton />
      ) : (
        <QueryState query={query}>
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[
              styles.content,
              { gap: 12, paddingTop: 16 },
            ]}
            data={event?.attachments ?? []}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <AttachmentRow compact attachment={item} />
            )}
            ListHeaderComponent={
              event ? (
                <View style={{ gap: 24 }}>
                  {showSaved ? (
                    <View
                      accessibilityRole="alert"
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: colors.soft,
                      }}
                    >
                      <CheckCircle2 size={19} color={colors.text} />
                      <T style={{ fontSize: 13 }}>{t("Событие сохранено")}</T>
                    </View>
                  ) : null}
                  <View style={{ gap: 8 }}>
                    <T style={{ color: colors.muted, fontSize: 12 }}>
                      {medicalEventMeta[event.type].label} · {event.petName}
                    </T>
                    <T
                      accessibilityRole="header"
                      style={{
                        fontSize: 28,
                        lineHeight: 36,
                        fontFamily: "Manrope_800ExtraBold",
                      }}
                    >
                      {event.title}
                    </T>
                  </View>
                  {badge(
                    CalendarDays,
                    `${formatEventDate(event.eventDate)}${event.eventTime ? ` · ${event.eventTime.slice(0, 5)}` : ""}`,
                    t("Время {timezone}", { timezone: event.eventTimezone }),
                  )}
                  {event.reminder
                    ? badge(
                        Bell,
                        t("Напомним {date}", {
                          date: new Date(
                            event.reminder.scheduledAt,
                          ).toLocaleString(intlLocale.value, {
                            timeZone: event.eventTimezone,
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        }),
                        `${t("За 24 часа до события")} · ${event.eventTimezone}`,
                      )
                    : null}
                  {event.notes ? (
                    <View style={{ gap: 8 }}>
                      <T style={{ fontFamily: "Manrope_700Bold" }}>
                        {t("Заметка")}
                      </T>
                      <T style={{ color: colors.muted }}>{event.notes}</T>
                    </View>
                  ) : null}
                  <T style={{ fontFamily: "Manrope_700Bold" }}>
                    {t("Фото и документы")}
                  </T>
                  {!event.attachments.length ? (
                    <T style={{ color: colors.muted }}>{t("Без вложений")}</T>
                  ) : null}
                </View>
              ) : undefined
            }
            ListFooterComponent={
              event?.canEdit ? (
                <View style={{ paddingTop: 24, gap: 12 }}>
                  <Button
                    secondary
                    danger
                    title={t("Удалить событие")}
                    disabled={remove.isPending}
                    icon={<Trash2 size={18} color={colors.danger} />}
                    onPress={() =>
                      Alert.alert(t("Удалить событие?"), undefined, [
                        { text: t("Отмена"), style: "cancel" },
                        {
                          text: t("Удалить"),
                          style: "destructive",
                          onPress: () => void destroy(),
                        },
                      ])
                    }
                  />
                  <ErrorText error={error} />
                </View>
              ) : undefined
            }
          />
        </QueryState>
      )}
    </Screen>
  );
}
