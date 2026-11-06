import { View } from "react-native";
import { CatMark } from "./Brand";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import { T } from "./ui";
export function EmptyPets() {
  const { colors } = useSettings();
  return (
    <View
      style={{
        flex: 1,
        minHeight: 280,
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        paddingVertical: 28,
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.soft,
        }}
      >
        <CatMark size={66} />
      </View>
      <T
        accessibilityRole="header"
        style={{
          fontSize: 24,
          lineHeight: 31,
          fontFamily: "Manrope_800ExtraBold",
          textAlign: "center",
        }}
      >
        {t("Давайте познакомимся\nс вашим питомцем")}
      </T>
      <T style={{ color: colors.muted, textAlign: "center" }}>
        {t("Создайте профиль, чтобы сохранять события и документы.")}
      </T>
    </View>
  );
}
