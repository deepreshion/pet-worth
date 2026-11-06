import { BottomSheet } from "./BottomSheet";
import type { PropsWithChildren, ReactNode, Ref } from "react";
import { View } from "react-native";
import { ChevronLeft, X } from "lucide-react-native";
import { router } from "expo-router";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import { Button, Screen, T } from "./ui";
import { IconButton } from "./design";

export function FormLayout({
  title,
  close = false,
  busy,
  footer,
  children,
  scrollRef,
}: PropsWithChildren<{
  title: string;
  close?: boolean;
  busy?: boolean;
  footer: ReactNode;
  scrollRef?: Ref<import("react-native").ScrollViewInstance>;
}>) {
  const { colors } = useSettings();
  return (
    <Screen
      topSafe
      scrollRef={scrollRef}
      contentStyle={{ gap: 24, paddingTop: 16 }}
      footer={footer}
      header={
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: close ? 24 : 16,
            paddingVertical: 6,
          }}
        >
          {!close ? (
            <IconButton
              label={t("Назад")}
              disabled={busy}
              onPress={() => router.back()}
            >
              <ChevronLeft size={20} color={colors.text} />
            </IconButton>
          ) : null}
          <T
            accessibilityRole="header"
            style={{
              flex: 1,
              fontSize: close ? 20 : 16,
              lineHeight: 28,
              fontFamily: "Manrope_700Bold",
            }}
          >
            {title}
          </T>
          {close ? (
            <IconButton
              label={t("Закрыть")}
              disabled={busy}
              onPress={() => router.back()}
            >
              <X size={20} color={colors.text} />
            </IconButton>
          ) : null}
        </View>
      }
    >
      {children}
    </Screen>
  );
}

export function DiscardChanges({
  action,
  onClose,
  description,
}: {
  action: (() => void) | null;
  onClose(): void;
  description: string;
}) {
  const { colors } = useSettings();
  return (
    <BottomSheet
      visible={Boolean(action)}
      backdropColor="#0006"
      onRequestClose={onClose}
    >
      <View
        accessibilityViewIsModal
        style={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        <T
          accessibilityRole="header"
          style={{
            fontSize: 24,
            lineHeight: 32,
            fontFamily: "Manrope_800ExtraBold",
          }}
        >
          {t("Выйти без сохранения?")}
        </T>
        <T style={{ color: colors.muted }}>{description}</T>
        <Button title={t("Продолжить заполнение")} onPress={onClose} />
        <Button
          secondary
          danger
          title={t("Выйти без сохранения")}
          onPress={() => {
            onClose();
            action?.();
          }}
        />
      </View>
    </BottomSheet>
  );
}
