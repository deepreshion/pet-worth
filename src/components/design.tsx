import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { PetPhoto } from "./PetPhoto";
import { Cat, Dog } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import type { PetSummary } from "@/types/domain";
import { t } from "@/i18n";
import { T } from "./ui";

export function IconButton({
  label,
  onPress,
  children,
  disabled = false,
}: {
  label: string;
  onPress(): void;
  children: ReactNode;
  disabled?: boolean;
}) {
  const { colors } = useSettings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
export function PetAvatar({
  pet,
  size = 64,
  height = size,
  radius = 18,
}: {
  pet: PetSummary;
  size?: number;
  height?: number;
  radius?: number;
}) {
  const { colors } = useSettings();
  return (
    <View
      style={{
        width: size,
        height,
        borderRadius: radius,
        backgroundColor: colors.soft,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AvatarImage key={pet.photoUrl} pet={pet} size={size} height={height} />
    </View>
  );
}
function AvatarImage({
  pet,
  size,
  height,
}: {
  pet: PetSummary;
  size: number;
  height: number;
}) {
  const [failed, setFailed] = useState(false);
  const { colors } = useSettings();
  const Icon = pet.species === "dog" ? Dog : Cat;
  return pet.photoUrl && !failed ? (
    <PetPhoto
      pet={pet}
      accessibilityLabel={t("Фото питомца {name}", { name: pet.name })}
      onError={() => setFailed(true)}
      style={{ width: size, height }}
      contentFit="cover"
    />
  ) : (
    <Icon size={size * 0.4} color={colors.muted} strokeWidth={1.4} />
  );
}
export function Segments<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  filled = false,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange(v: T): void;
  disabled?: boolean;
  filled?: boolean;
}) {
  const { colors } = useSettings();
  return (
    <View style={{ gap: 10 }}>
      <T style={design.label}>{label}</T>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{
              checked: value === option.value,
              disabled: Boolean(disabled),
            }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 56,
              padding: 10,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: value === option.value ? colors.text : colors.border,
              backgroundColor:
                value === option.value
                  ? filled
                    ? colors.action
                    : colors.soft
                  : colors.surface,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            {option.icon}
            <T
              style={{
                textAlign: "center",
                fontSize: 13,
                color:
                  filled && value === option.value
                    ? colors.onAction
                    : colors.text,
                fontFamily: "Manrope_600SemiBold",
                flexShrink: 1,
              }}
            >
              {option.label}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export const design = StyleSheet.create({
  title: { fontFamily: "Manrope_800ExtraBold", fontSize: 32, lineHeight: 38 },
  label: { fontSize: 13, lineHeight: 19 },
  muted: { fontSize: 13, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
