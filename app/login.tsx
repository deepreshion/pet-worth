import { useEffect, useRef, useState } from "react";
import { View, Pressable, BackHandler, Keyboard, Platform } from "react-native";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react-native";
import { OtpInput } from "@/components/OtpInput";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/utils/emailOtp";
import { Brand } from "@/components/Brand";
import { design } from "@/components/design";
import { useForm } from "react-hook-form";
import { Image } from "expo-image";
import { useAuth } from "@/providers/Auth";
import { useSettings } from "@/providers/Settings";
import { configured } from "@/lib/supabase";
import { Button, ErrorText, Field, Screen, T } from "@/components/ui";
import { t } from "@/i18n";
export default function Login() {
  const auth = useAuth();
  const settings = useSettings();
  const form = useForm({ defaultValues: { email: "" } });
  const [error, setError] = useState<unknown>();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(Keyboard.isVisible);
  const [now, setNow] = useState(() => Date.now());
  const [deadline, setDeadline] = useState(0);
  const deadlines = useRef<Record<string, number>>({});
  const locked = useRef(false);
  const remaining = sentEmail
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : 0;
  const changeEmail = () => {
    if (locked.current) return;
    setSentEmail(null);
    setCode("");
    setError(undefined);
  };
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    if (!sentEmail) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!locked.current) {
        setSentEmail(null);
        setCode("");
        setError(undefined);
      }
      return true;
    });
    return () => {
      clearInterval(timer);
      back.remove();
    };
  }, [sentEmail]);
  const send = async (email: string) => {
    if (locked.current) return;
    email = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("EMAIL_INVALID");
      return;
    }
    const key = email.toLowerCase();
    if ((deadlines.current[key] ?? 0) > Date.now()) {
      setError("AUTH_RATE_LIMIT");
      return;
    }
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await auth.sendEmailOtp(email);
      deadlines.current[key] = Date.now() + OTP_RESEND_SECONDS * 1000;
      setDeadline(deadlines.current[key]);
      setNow(Date.now());
      setSentEmail(email);
      setCode("");
    } catch (e) {
      if (e instanceof Error && e.message === "AUTH_RATE_LIMIT") {
        deadlines.current[key] = Date.now() + OTP_RESEND_SECONDS * 1000;
        setDeadline(deadlines.current[key]);
        setNow(Date.now());
      }
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const submit = () => form.handleSubmit(({ email }) => send(email))();
  const verify = async () => {
    if (locked.current || !sentEmail || code.length !== OTP_LENGTH) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await auth.verifyEmailOtp(sentEmail, code);
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  if (sentEmail) {
    const invalid =
      error instanceof Error
        ? ["AUTH_OTP_INVALID", "AUTH_OTP_FORMAT"].includes(error.message)
        : false;
    return (
      <Screen topSafe contentStyle={{ gap: 16 }}>
        <View style={design.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Назад")}
            disabled={busy}
            onPress={changeEmail}
            style={{
              minHeight: 44,
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
            }}
          >
            <ArrowLeft size={20} color={settings.colors.text} />
            <T>{t("Назад")}</T>
          </Pressable>
          <Brand />
        </View>
        <View style={{ gap: 10 }}>
          <T accessibilityRole="header" style={design.title}>
            {t("Код из письма")}
          </T>
          <T style={{ color: settings.colors.muted }}>
            {t("Отправили код для входа на почту")}
            {"\n"}
            {sentEmail}
          </T>
          <Pressable
            testID="change-email"
            accessibilityRole="button"
            disabled={busy}
            onPress={changeEmail}
            style={{
              minHeight: 44,
              justifyContent: "center",
              alignSelf: "flex-start",
            }}
          >
            <T
              style={{
                fontSize: 13,
                fontFamily: "Manrope_700Bold",
                textDecorationLine: "underline",
              }}
            >
              {t("Изменить почту")}
            </T>
          </Pressable>
        </View>
        <View style={{ gap: 8 }}>
          <OtpInput
            value={code}
            disabled={busy}
            invalid={invalid}
            onChange={(next) => {
              setCode(next);
              setError(undefined);
            }}
          />
          {error ? (
            <ErrorText error={error} />
          ) : (
            <T style={{ color: settings.colors.muted, fontSize: 12 }}>
              {t("Введите 6 цифр из письма")}
            </T>
          )}
        </View>
        <Button
          testID="verify-otp"
          title={busy ? t("Подтверждаем…") : t("Подтвердить")}
          disabled={busy || code.length !== OTP_LENGTH}
          icon={<ArrowRight size={21} color={settings.colors.onAction} />}
          onPress={() => {
            void verify();
          }}
        />
        <Pressable
          testID="resend-otp"
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || remaining > 0 }}
          disabled={busy || remaining > 0}
          onPress={() => {
            void send(sentEmail);
          }}
          style={{
            minHeight: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <T
            style={{
              fontSize: 13,
              color:
                remaining > 0 ? settings.colors.muted : settings.colors.text,
              textDecorationLine: remaining > 0 ? "none" : "underline",
            }}
          >
            {remaining > 0
              ? t("Отправить ещё раз через {time}", {
                  time: `00:${String(remaining).padStart(2, "0")}`,
                })
              : t("Отправить код ещё раз")}
          </T>
        </Pressable>
      </Screen>
    );
  }
  return (
    <Screen topSafe contentStyle={keyboardVisible ? { gap: 12 } : undefined}>
      <View style={design.row}>
        <Brand />
        <View
          style={{
            flexDirection: "row",
            backgroundColor: settings.colors.soft,
            borderRadius: 20,
          }}
        >
          {(["ru", "en"] as const).map((lang) => (
            <Pressable
              key={lang}
              accessibilityRole="button"
              accessibilityLabel={lang === "ru" ? "Русский" : "English"}
              accessibilityState={{ selected: settings.locale === lang }}
              onPress={() => {
                void settings.setLocale(lang).catch(setError);
              }}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T
                style={{
                  fontSize: 12,
                  fontFamily: "Manrope_700Bold",
                  color:
                    settings.locale === lang
                      ? settings.colors.text
                      : settings.colors.muted,
                }}
              >
                {lang.toUpperCase()}
              </T>
            </Pressable>
          ))}
        </View>
      </View>
      {!keyboardVisible ? (
        <Image
          source={require("../assets/onboarding/together.png")}
          accessibilityLabel={t("Фото собаки и кошки")}
          style={{
            width: "100%",
            aspectRatio: 1.8,
            borderRadius: 26,
            borderTopRightRadius: 76,
            borderBottomLeftRadius: 76,
          }}
          contentFit="cover"
        />
      ) : null}
      <View style={{ gap: 12, marginTop: 10 }}>
        <T accessibilityRole="header" style={design.title}>
          {t("Добро\nпожаловать")}
        </T>
        <T style={{ color: settings.colors.muted }}>
          {t("Введите почту — отправим код\nдля входа. Пароль не нужен.")}
        </T>
      </View>
      <View style={{ gap: 12, marginTop: 12 }}>
        <Field
          control={form.control}
          name="email"
          label={t("Электронная почта")}
          placeholder="name@example.com"
          leading={<Mail size={18} color={settings.colors.muted} />}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          testID="email-input"
          editable={!busy}
        />
        <ErrorText error={error} />
        {!configured ? (
          <T>{t("Сервер не настроен. Обратитесь к разработчику.")}</T>
        ) : null}
        <Button
          testID="send-otp"
          title={busy ? t("Отправляем…") : t("Получить код")}
          disabled={busy || !configured}
          icon={<ArrowRight size={21} color={settings.colors.onAction} />}
          onPress={() => {
            void submit();
          }}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <KeyRound size={14} color={settings.colors.muted} />
        <T
          style={{ color: settings.colors.muted, fontSize: 11, flexShrink: 1 }}
        >
          {t("Один код для входа и регистрации")}
        </T>
      </View>
    </Screen>
  );
}
