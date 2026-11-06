import {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Pressable, View } from "react-native";
import { useState } from "react";
import { Check, ChevronRight, Search, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import type { PetSummary } from "@/types/domain";
import { BottomSheet } from "./BottomSheet";
import { PetCardsIcon } from "./PetCardsIcon";
import { IconButton, PetAvatar, design } from "./design";
import { Input, T } from "./ui";

export function PetPicker({
  visible,
  pets,
  selected,
  adding = false,
  onClose,
  onSelect,
}: {
  visible: boolean;
  pets: PetSummary[];
  selected: string;
  adding?: boolean;
  onClose(): void;
  onSelect(id: string): void;
}) {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const choose = (id: string) => {
    onSelect(id);
    setSearch("");
  };
  const close = () => {
    onClose();
    setSearch("");
  };
  const filtered = pets.filter(
    (p) =>
      (!adding || p.canEdit) &&
      p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <BottomSheet
      avoidKeyboard
      visible={visible}
      onRequestClose={close}
      onBackdropPress={close}
      backdropColor="#10121666"
      scrollable
      maxHeightRatio={0.8}
    >
      <BottomSheetFlatList
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <View style={design.row}>
              <T
                accessibilityRole="header"
                style={{
                  flex: 1,
                  fontFamily: "Manrope_800ExtraBold",
                  fontSize: 21,
                }}
              >
                {t("Выбрать питомца")}
              </T>
              <IconButton label={t("Закрыть")} onPress={close}>
                <X size={20} color={colors.text} />
              </IconButton>
            </View>
            <Input
              inputComponent={BottomSheetTextInput}
              hideLabel
              label={t("Найти по имени")}
              placeholder={t("Найти по имени")}
              value={search}
              onChangeText={setSearch}
              leading={<Search size={18} color={colors.muted} />}
            />
            {!adding ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Все питомцы")}
                accessibilityState={{ selected: selected === "all" }}
                onPress={() => choose("all")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  marginTop: 12,
                  borderRadius: 16,
                  backgroundColor:
                    selected === "all" ? colors.soft : colors.surface,
                }}
              >
                <PetCardsIcon size={22} color={colors.text} />
                <T style={{ flex: 1, fontFamily: "Manrope_700Bold" }}>
                  {t("Все питомцы")}
                </T>
                <T style={{ color: colors.muted }}>{pets.length}</T>
                <ChevronRight size={16} color={colors.text} />
              </Pressable>
            ) : null}
            <T
              style={{
                color: colors.muted,
                fontSize: 12,
                marginTop: 18,
                marginBottom: 8,
              }}
            >
              {t("Ваши питомцы")}
            </T>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          gap: 4,
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom),
        }}
        ListEmptyComponent={
          <T style={{ paddingVertical: 16, color: colors.muted }}>
            {t("Питомцы не найдены")}
          </T>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Питомец: {name}", { name: item.name })}
            accessibilityState={{ selected: selected === item.id }}
            onPress={() => choose(item.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 10,
              borderRadius: 16,
              backgroundColor: selected === item.id ? colors.soft : undefined,
            }}
          >
            <PetAvatar pet={item} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontFamily: "Manrope_700Bold" }}>{item.name}</T>
              <T style={{ color: colors.muted, fontSize: 12 }}>
                {item.species === "dog" ? t("Собака") : t("Кошка")}
              </T>
            </View>
            {selected === item.id ? (
              <Check size={18} color={colors.text} />
            ) : null}
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}
