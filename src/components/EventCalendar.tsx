import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { MedicalEvent } from "@/types/domain";
import { localDateString } from "@/utils/medicalEvents";
import { intlLocale, t } from "@/i18n";
import { useSettings } from "@/providers/Settings";
import { T } from "./ui";
import { IconButton, design } from "./design";
export function EventCalendar({
  events,
  selected,
  onSelect,
  initialDate,
  picker = false,
}: {
  initialDate?: string;
  picker?: boolean;
  events: MedicalEvent[];
  selected: string | null;
  onSelect(value: string | null): void;
}) {
  const { colors } = useSettings();
  const [month, setMonth] = useState(() => {
    const date = initialDate ? new Date(`${initialDate}T12:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const eventDates = useMemo(
    () => new Set(events.map((event) => event.eventDate)),
    [events],
  );
  const lead = (month.getDay() + 6) % 7;
  const today = localDateString();
  const change = (delta: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    if (!picker) onSelect(null);
  };
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 24,
        backgroundColor: colors.surface,
        gap: 8,
      }}
    >
      <View style={design.row}>
        <T
          accessibilityRole="header"
          style={{ flex: 1, fontFamily: "Manrope_700Bold", fontSize: 16 }}
        >
          {(() => {
            const label = month.toLocaleDateString(intlLocale.value, {
              month: "long",
            });
            return `${label.charAt(0).toLocaleUpperCase(intlLocale.value)}${label.slice(1)} ${month.getFullYear()}`;
          })()}
        </T>
        <View style={{ flexDirection: "row", gap: 2 }}>
          <IconButton label={t("Предыдущий месяц")} onPress={() => change(-1)}>
            <ChevronLeft size={18} color={colors.text} />
          </IconButton>
          <IconButton label={t("Следующий месяц")} onPress={() => change(1)}>
            <ChevronRight size={18} color={colors.text} />
          </IconButton>
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        {Array.from({ length: 7 }, (_, i) => (
          <T
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              color: colors.muted,
              fontSize: 11,
              lineHeight: 20,
              fontFamily: "Manrope_600SemiBold",
            }}
          >
            {new Date(2026, 10, 2 + i)
              .toLocaleDateString(intlLocale.value, { weekday: "short" })
              .toUpperCase()}
          </T>
        ))}
      </View>
      <View>
        {Array.from(
          {
            length: Math.max(
              5,
              Math.ceil(
                (lead +
                  new Date(
                    month.getFullYear(),
                    month.getMonth() + 1,
                    0,
                  ).getDate()) /
                  7,
              ),
            ),
          },
          (_, week) => (
            <View key={week} style={{ flexDirection: "row" }}>
              {Array.from({ length: 7 }, (_, day) => {
                const value = new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  week * 7 + day - lead + 1,
                );
                const date = localDateString(value);
                const inMonth = value.getMonth() === month.getMonth();
                const hasEvents = eventDates.has(date);
                const isSelected = selected === date;
                const isToday = date === today;
                return (
                  <Pressable
                    key={date}
                    accessibilityRole="button"
                    accessibilityLabel={value.toLocaleDateString(
                      intlLocale.value,
                    )}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() =>
                      onSelect(!picker && selected === date ? null : date)
                    }
                    style={{
                      flex: 1,
                      minHeight: 48,
                      padding: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        maxWidth: 40,
                        minHeight: 40,
                        paddingVertical: 6,
                        borderRadius: 999,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected
                          ? colors.action
                          : hasEvents
                            ? colors.soft
                            : undefined,
                        borderWidth: 1,
                        borderColor:
                          isToday && !isSelected ? colors.text : "transparent",
                      }}
                    >
                      <T
                        style={{
                          fontSize: 14,
                          fontFamily:
                            hasEvents || isSelected
                              ? "Manrope_700Bold"
                              : "Manrope_400Regular",
                          color: isSelected
                            ? colors.onAction
                            : inMonth || hasEvents
                              ? colors.text
                              : colors.muted,
                          opacity:
                            inMonth || isSelected || hasEvents ? 1 : 0.45,
                        }}
                      >
                        {value.getDate()}
                      </T>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ),
        )}
      </View>
    </View>
  );
}
