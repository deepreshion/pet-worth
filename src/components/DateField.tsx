import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import { Button, Card, T } from "./ui";
import { BottomSheet } from "./BottomSheet";
import { localDateString } from "@/utils/medicalEvents";
import { intlLocale, t } from "@/i18n";
import { CalendarDays, Clock } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
export function DateField({
  label,
  value,
  onChange,
  mode = "date",
  maximumDate,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  mode?: "date" | "time";
  maximumDate?: Date;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { locale, colors, dark } = useSettings();
  const pickerTheme = dark ? "dark" : "light";
  const date =
    mode === "date"
      ? new Date(`${value || localDateString()}T12:00:00`)
      : new Date(`2000-01-01T${value || "10:00"}:00`);
  const picker = (
    <DateTimePicker
      value={date}
      mode={mode}
      maximumDate={maximumDate}
      themeVariant={pickerTheme}
      locale={locale}
      display={Platform.OS === "ios" ? "spinner" : "default"}
      onChange={(event, selected) => {
        if (Platform.OS === "android") setOpen(false);
        if (event.type === "set" && selected)
          onChange(
            mode === "date"
              ? localDateString(selected)
              : `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}`,
          );
      }}
    />
  );
  return (
    <View style={{ gap: 8 }}>
      <T style={{ fontSize: 13 }}>{label}</T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        accessibilityState={{ disabled }}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          minHeight: 52,
          padding: 14,
          borderWidth: 1,
          borderRadius: 14,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        {mode === "date" ? (
          <CalendarDays size={18} color={colors.muted} />
        ) : (
          <Clock size={18} color={colors.muted} />
        )}
        <T>
          {value
            ? mode === "date"
              ? new Date(`${value}T12:00:00`).toLocaleDateString(
                  intlLocale.value,
                )
              : value
            : t("Выберите дату")}
        </T>
      </Pressable>
      {open && Platform.OS === "android" ? picker : null}
      <BottomSheet
        visible={open && Platform.OS === "ios"}
        backdropColor="#0008"
        contentStyle={{ padding: 20 }}
        onRequestClose={() => setOpen(false)}
      >
        <Card>
          <NativeViewGestureHandler disallowInterruption>
            <View style={{ backgroundColor: colors.surface }}>{picker}</View>
          </NativeViewGestureHandler>
          <Button
            title={t("Готово")}
            onPress={() => {
              if (!value)
                onChange(mode === "date" ? localDateString() : "10:00");
              setOpen(false);
            }}
          />
        </Card>
      </BottomSheet>
    </View>
  );
}
