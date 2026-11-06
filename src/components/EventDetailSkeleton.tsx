import { ScrollView, View } from "react-native";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";

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

export function EventDetailSkeleton() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 24, paddingTop: 16 }}
    >
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t("Загрузка")}
        accessibilityState={{ busy: true }}
        style={{ gap: 24 }}
      >
        <View style={{ gap: 12 }}>
          <Bone width="48%" height={14} />
          <Bone width="88%" height={32} />
          <Bone width="58%" height={32} />
        </View>
        {[0, 1].map((row) => (
          <View
            key={row}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Bone width={44} height={44} />
            <View style={{ flex: 1, gap: 8 }}>
              <Bone width="82%" />
              <Bone width="62%" height={12} />
            </View>
          </View>
        ))}
        <View style={{ gap: 12 }}>
          <Bone width="26%" />
          <Bone width="100%" height={14} />
          <Bone width="92%" height={14} />
          <Bone width="64%" height={14} />
        </View>
        <View style={{ gap: 12 }}>
          <Bone width="54%" />
          {[0, 1].map((row) => (
            <View
              key={row}
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Bone width={44} height={44} />
              <View style={{ flex: 1, gap: 8 }}>
                <Bone width="74%" />
                <Bone width="38%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

export function EventDetailFooterSkeleton() {
  const { colors } = useSettings();
  return (
    <View
      style={{ height: 56, borderRadius: 30, backgroundColor: colors.border }}
    />
  );
}
