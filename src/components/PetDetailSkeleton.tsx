import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import { IconButton } from "./design";
import { Screen } from "./ui";

function Bone({
  width,
  height = 16,
}: {
  width: number | `${number}%`;
  height?: number;
}) {
  const { colors } = useSettings();
  return (
    <View
      style={{
        width,
        height,
        borderRadius: Math.min(height / 2, 16),
        backgroundColor: colors.border,
      }}
    />
  );
}
export function PetContentSkeleton() {
  const { colors } = useSettings();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t("Загрузка")}
      accessibilityState={{ busy: true }}
      style={{ gap: 20, paddingTop: 20 }}
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Bone width="30%" height={44} />
        <Bone width="30%" height={44} />
        <Bone width="30%" height={44} />
      </View>
      <Bone width="52%" height={22} />
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Bone width={44} height={44} />
          <View style={{ flex: 1, gap: 10 }}>
            <Bone width="85%" />
            <Bone width="55%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
export function PetDetailSkeleton() {
  const { colors } = useSettings();
  return (
    <Screen
      topSafe
      backgroundColor={colors.soft}
      footer={
        <View
          style={{
            height: 56,
            borderRadius: 30,
            backgroundColor: colors.border,
          }}
        />
      }
      contentStyle={{ padding: 0, gap: 0 }}
    >
      <View style={{ marginHorizontal: 12 }}>
        <View
          style={{
            height: 260,
            borderRadius: 32,
            backgroundColor: colors.border,
          }}
        >
          <View style={{ position: "absolute", left: 12, top: 16 }}>
            <IconButton
              label={t("Назад")}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/pets")
              }
            >
              <ArrowLeft size={22} color={colors.text} />
            </IconButton>
          </View>
        </View>
        <View style={[s.card, { backgroundColor: colors.background }]}>
          <View style={{ gap: 12 }}>
            <Bone width="42%" height={34} />
            <Bone width="64%" height={14} />
            <Bone width="48%" height={14} />
          </View>
          <View style={{ marginTop: 20 }}>
            <Bone width="100%" height={52} />
          </View>
          <PetContentSkeleton />
        </View>
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  card: {
    marginTop: -28,
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 24,
  },
});
