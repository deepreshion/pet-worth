import { useState } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Pressable, View } from "react-native";
import { CalendarDays, ChevronDown, X } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import { formatEventDate } from "@/presentation/medicalEvents";
import { localDateString } from "@/utils/medicalEvents";
import { t } from "@/i18n";
import { BottomSheet } from "./BottomSheet";
import { EventCalendar } from "./EventCalendar";
import { Button, T } from "./ui";
import { IconButton } from "./design";

export function EventDateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
}) {
  const { colors } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const today = localDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    <View style={{ gap: 8 }}>
      <T style={{ fontSize: 13 }}>{t("Когда произошло или запланировано")}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Дата события")}
        disabled={disabled}
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        style={{
          minHeight: 52,
          padding: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        }}
      >
        <CalendarDays size={18} color={colors.text} />
        <T style={{ flex: 1 }}>
          {value === today ? `${t("Сегодня")}, ` : ""}
          {formatEventDate(value)}
        </T>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>
      <BottomSheet
        visible={open}
        backdropColor="#0005"
        onRequestClose={() => setOpen(false)}
        scrollable
      >
        <BottomSheetScrollView
          accessibilityViewIsModal
          contentContainerStyle={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 40,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <T
              style={{
                flex: 1,
                fontSize: 22,
                lineHeight: 30,
                fontFamily: "Manrope_800ExtraBold",
              }}
            >
              {t("Дата события")}
            </T>
            <IconButton label={t("Закрыть")} onPress={() => setOpen(false)}>
              <X size={20} color={colors.text} />
            </IconButton>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              secondary
              style={{ flex: 1 }}
              title={t("Сегодня")}
              onPress={() => setDraft(today)}
            />
            <Button
              secondary
              style={{ flex: 1 }}
              title={t("Завтра")}
              onPress={() => setDraft(localDateString(tomorrow))}
            />
          </View>
          <EventCalendar
            key={draft.slice(0, 7)}
            picker
            initialDate={draft}
            events={[]}
            selected={draft}
            onSelect={(v) => {
              if (v) setDraft(v);
            }}
          />
          <Button
            title={`${t("Выбрать")} ${formatEventDate(draft)}`}
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
