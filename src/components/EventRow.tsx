import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  Bandage,
  Bell,
  ChevronRight,
  FlaskConical,
  Paperclip,
  Stethoscope,
  Syringe,
} from "lucide-react-native";
import type { MedicalEvent } from "@/types/domain";
import {
  formatEventCardDate,
  medicalEventMeta,
} from "@/presentation/medicalEvents";
import { fileCount } from "@/presentation/counts";
import { useSettings } from "@/providers/Settings";
import { T } from "./ui";
import { t } from "@/i18n";

export type EventCardVariant = "featured" | "home-list" | "pet-list";
const categoryStyles = {
  vet_visit: { icon: Stethoscope, bg: "diaryVetBg", ink: "diaryVetInk" },
  vaccination: { icon: Syringe, bg: "diaryVaxBg", ink: "diaryVaxInk" },
  analysis: { icon: FlaskConical, bg: "diaryLabBg", ink: "diaryLabInk" },
  procedure: { icon: Bandage, bg: "diaryCareBg", ink: "diaryCareInk" },
} as const;

export function EventRow({
  event,
  variant,
  showPet = false,
  relative = false,
}: {
  event: MedicalEvent;
  variant: EventCardVariant;
  showPet?: boolean;
  relative?: boolean;
}) {
  const { colors } = useSettings();
  const featured = variant === "featured";
  const category = categoryStyles[event.type];
  const Icon = category.icon;
  const ink = colors[category.ink];
  const bg = colors[category.bg];
  const date =
    variant === "home-list"
      ? event.eventTime?.slice(0, 5) || t("Время не указано")
      : formatEventCardDate(event.eventDate, event.eventTime, relative);
  const dateText = (
    <T style={[s.date, { color: featured ? ink : colors.muted }]}>{date}</T>
  );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/medical-events/${event.id}`)}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: featured ? bg : colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={s.category}>
        <View style={[s.icon, { backgroundColor: bg }]}>
          <Icon size={18} color={ink} />
        </View>
        <T style={[s.label, { color: ink }]}>
          {event.type === "procedure"
            ? t("Процедура")
            : medicalEventMeta[event.type].label}
        </T>
        {showPet ? (
          <T style={[s.pet, { color: colors.muted }]}>{event.petName}</T>
        ) : null}
        <ChevronRight size={18} color={colors.muted} />
      </View>
      {featured ? dateText : null}
      <T style={[s.title, featured && s.featuredTitle]}>{event.title}</T>
      {!featured ? dateText : null}
      {featured && event.notes?.trim() ? (
        <T numberOfLines={2} style={[s.date, { color: colors.muted }]}>
          {event.notes}
        </T>
      ) : null}
      {event.attachments.length || event.reminder ? (
        <View style={s.metadata}>
          {event.attachments.length ? (
            <View style={s.metadataItem}>
              <Paperclip size={14} color={colors.muted} />
              <T style={[s.caption, { color: colors.muted }]}>
                {fileCount(event.attachments.length)}
              </T>
            </View>
          ) : null}
          {event.reminder ? (
            <View style={s.metadataItem}>
              <Bell size={14} color={colors.muted} />
              <T style={[s.caption, { color: colors.muted }]}>
                {t("Напоминание")}
              </T>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: { padding: 16, gap: 8, borderRadius: 22, borderCurve: "continuous" },
  category: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Manrope_700Bold",
  },
  pet: { maxWidth: "40%", flexShrink: 1, fontSize: 12, lineHeight: 17 },
  title: { fontSize: 15, lineHeight: 21, fontFamily: "Manrope_800ExtraBold" },
  featuredTitle: { fontSize: 20, lineHeight: 28 },
  date: { fontSize: 13, lineHeight: 18 },
  metadata: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  caption: { fontSize: 12, lineHeight: 17, flexShrink: 1 },
});
