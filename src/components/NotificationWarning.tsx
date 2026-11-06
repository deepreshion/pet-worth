import { useState } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "@/providers/Settings";
import { captureTechnicalError } from "@/lib/monitoring";
import { openNotificationSettings } from "@/platform/notificationSettings";
import { t } from "@/i18n";
import { BottomSheet } from "./BottomSheet";
import { Button, T } from "./ui";

export function NotificationWarning() {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);

  const close = () => setDismissed(true);

  return (
    <BottomSheet
      visible={!dismissed}
      backdropColor="#0006"
      onRequestClose={close}
      onBackdropPress={close}
      scrollable
      maxHeightRatio={0.9}
    >
      <BottomSheetScrollView
        style={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: Math.max(40, insets.bottom + 16),
          gap: 16,
        }}
      >
        <T
          accessibilityRole="header"
          style={{
            fontSize: 23,
            lineHeight: 30,
            fontFamily: "Manrope_800ExtraBold",
          }}
        >
          {t("Напоминания")}
        </T>
        <T accessibilityRole="alert" style={{ color: colors.muted }}>
          {t(
            "Часть напоминаний не запланирована. Проверьте разрешения и системный лимит уведомлений.",
          )}
        </T>
        <Button
          title={t("Настройки уведомлений")}
          onPress={() => {
            void openNotificationSettings()
              .then(close)
              .catch((error) =>
                captureTechnicalError(error, "notification_settings"),
              );
          }}
        />
        <Button
          secondary
          title={t("Скрыть")}
          onPress={close}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
