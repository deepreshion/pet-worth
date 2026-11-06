import { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { ArrowRight, ChevronLeft } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import { Brand } from "@/components/Brand";
import { IconButton, design } from "@/components/design";
import { Button, ErrorText, Screen, T } from "@/components/ui";
import { t } from "@/i18n";
const slides = [
  {
    image: require("../assets/onboarding/together.png"),
    alt: "Фото собаки и кошки",
    title: "Забота о питомце\nв одном\nприложении",
    description: "История здоровья, документы\nи напоминания — всё под рукой.",
  },
  {
    image: require("../assets/onboarding/cat.png"),
    alt: "Фото кошки",
    title: "Вся история\nздоровья —\nпод рукой",
    description:
      "Сохраняйте прививки, приёмы и документы.\nНужная информация всегда рядом.",
  },
  {
    image: require("../assets/onboarding/reminders.jpg"),
    alt: "Кот с часами",
    title: "Важные\nсобытия —\nвовремя",
    description:
      "Планируйте прививки, приёмы и процедуры.\nНапомним за день до события.",
  },
] as const;
export default function Onboarding() {
  const settings = useSettings();
  const { height, width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const slide = slides[step];
  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      await settings.finishOnboarding();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      topSafe
      contentStyle={{ gap: 16, paddingBottom: 8 }}
      footer={
        <View style={{ gap: 12 }}>
          <View
            accessibilityLabel={t("Страница {current} из {total}", {
              current: step + 1,
              total: 3,
            })}
            style={{ flexDirection: "row", gap: 5, justifyContent: "center" }}
          >
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  height: 5,
                  width: i === step ? 22 : 6,
                  borderRadius: 4,
                  backgroundColor:
                    i === step ? settings.colors.text : settings.colors.border,
                }}
              />
            ))}
          </View>
          <ErrorText error={error} />
          <Button
            title={step === 2 ? t("Начать") : t("Далее")}
            disabled={busy}
            icon={<ArrowRight color={settings.colors.onAction} size={21} />}
            onPress={() => {
              if (step === 2) void finish();
              else setStep(step + 1);
            }}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void finish()}
            style={{
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T style={{ fontSize: 12, color: settings.colors.muted }}>
              {t("Уже есть аккаунт?")}{" "}
              <T style={{ fontFamily: "Manrope_700Bold", fontSize: 12 }}>
                {t("Войти")}
              </T>
            </T>
          </Pressable>
        </View>
      }
    >
      <View style={design.row}>
        {step ? (
          <IconButton label={t("Назад")} onPress={() => setStep(step - 1)}>
            <ChevronLeft size={20} color={settings.colors.text} />
          </IconButton>
        ) : (
          <Brand />
        )}
        <Pressable
          accessibilityRole="button"
          testID="skip-onboarding"
          disabled={busy}
          onPress={() => void finish()}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <T style={{ color: settings.colors.muted, fontSize: 12 }}>
            {t("Пропустить")}
          </T>
        </Pressable>
      </View>
      <Image
        source={slide.image}
        accessibilityLabel={t(slide.alt)}
        contentFit="cover"
        style={{
          width: "100%",
          height: Math.min((width - 48) / 1.1, Math.max(180, height * 0.32)),
          borderRadius: 28,
          borderTopLeftRadius: 76,
          borderBottomRightRadius: 76,
        }}
      />
      <T accessibilityRole="header" style={design.title}>
        {t(slide.title)}
      </T>
      <T style={{ color: settings.colors.muted }}>{t(slide.description)}</T>
      <View style={{ flex: 1, minHeight: 4 }} />
    </Screen>
  );
}
