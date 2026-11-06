import { Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react-native";
import type { PetSummary } from "@/types/domain";
import { formatPetAge } from "@/presentation/pet";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import { Button, T } from "./ui";
import { PetAvatar } from "./design";
export function PetCard({
  pet,
  variant = "home",
  onChoose,
}: {
  pet: PetSummary;
  variant?: "home" | "list";
  onChoose?(): void;
}) {
  const { colors } = useSettings();
  const age = formatPetAge(pet.birthDate, pet.birthDateApproximate);
  if (variant === "list")
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Открыть профиль питомца {name}", {
          name: pet.name,
        })}
        onPress={() => router.push(`/pets/${pet.id}`)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          gap: 16,
          borderRadius: 24,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <PetAvatar pet={pet} size={88} height={114} />
        <View style={{ flex: 1, gap: 4 }}>
          <T
            style={{
              fontSize: 20,
              lineHeight: 27,
              fontFamily: "Manrope_700Bold",
            }}
          >
            {pet.name}
          </T>
          <T style={{ color: colors.muted, fontSize: 12 }}>
            {pet.breed || t("Порода не указана")}
          </T>
          <T style={{ color: colors.muted, fontSize: 12 }}>
            {age || t("Возраст неизвестен")}
          </T>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>
    );
  const profileLabel = t("Открыть профиль питомца {name}", { name: pet.name });
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        padding: 12,
        borderRadius: 24,
        backgroundColor: colors.card,
        alignItems: "center",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={profileLabel}
        onPress={() => router.push(`/pets/${pet.id}`)}
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 14,
          borderBottomRightRadius: 28,
          borderBottomLeftRadius: 14,
          overflow: "hidden",
        }}
      >
        <PetAvatar pet={pet} size={92} height={120} radius={0} />
      </Pressable>
      <View style={{ flex: 1, gap: 4, minHeight: 120 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {onChoose ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Выбрать питомца")}
              onPress={onChoose}
              style={{
                flex: 1,
                minHeight: 44,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <T
                style={{
                  fontSize: 24,
                  lineHeight: 31,
                  fontFamily: "Manrope_800ExtraBold",
                  flexShrink: 1,
                }}
              >
                {pet.name}
              </T>
              <ChevronDown size={16} color={colors.text} />
            </Pressable>
          ) : (
            <T
              style={{
                flex: 1,
                fontSize: 24,
                lineHeight: 31,
                fontFamily: "Manrope_800ExtraBold",
              }}
            >
              {pet.name}
            </T>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profileLabel}
            onPress={() => router.push(`/pets/${pet.id}`)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowUpRight size={18} color={colors.text} />
          </Pressable>
        </View>
        <T
          style={{ fontSize: 12, lineHeight: 16, color: colors.muted, flex: 1 }}
        >
          {[pet.breed, age].filter(Boolean).join(" · ") ||
            t("Возраст неизвестен")}
        </T>
        {pet.canEdit ? (
          <Button
            compact
            style={{ minHeight: 44, borderRadius: 14 }}
            title={t("Добавить событие")}
            icon={<Plus size={15} color={colors.onAction} />}
            onPress={() => router.push(`/pets/${pet.id}/medical-events/new`)}
          />
        ) : null}
      </View>
    </View>
  );
}
