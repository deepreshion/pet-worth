import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { t } from "@/i18n";
import { useSettings } from "@/providers/Settings";
import { Button, Screen, T } from "./ui";

export function StartupError({ onRetry }: { onRetry(): void }) {
  const { colors } = useSettings();
  return (
    <Screen topSafe contentStyle={styles.content}>
      <View style={styles.body}>
        <View style={styles.illustration}>
          <Image
            source={require("../../assets/loader/startup-error-cat.png")}
            accessible={false}
            contentFit="contain"
            style={styles.image}
          />
        </View>
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.notice, { backgroundColor: colors.surface }]}
        >
          <T accessibilityRole="header" style={styles.title}>
            {t("Не получилось загрузить данные")}
          </T>
          <T style={[styles.description, { color: colors.muted }]}>
            {t("Проверьте подключение к интернету и попробуйте ещё раз.")}
          </T>
        </View>
        <Button title={t("Повторить загрузку")} onPress={onRetry} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  body: { width: "100%", maxWidth: 440, alignSelf: "center", gap: 24 },
  illustration: {
    width: "100%",
    maxWidth: 280,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
  },
  image: { width: "100%", aspectRatio: 603 / 486 },
  notice: { padding: 20, borderRadius: 24, gap: 10 },
  title: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
  description: { fontSize: 15, lineHeight: 23, textAlign: "center" },
});
