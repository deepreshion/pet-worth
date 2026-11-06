import { useNotice, LocalNotice } from "@/providers/Notices";
import { useEffect, useState } from "react";
import type { PropsWithChildren, ReactNode, ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { usePreventRemove } from "expo-router";
import { t } from "@/i18n";
import { useSettings } from "@/providers/Settings";
import { errorMessage } from "@/presentation/errors";
export function T({ style, ...props }: TextProps) {
  const { colors } = useSettings();
  return (
    <Text {...props} style={[styles.text, { color: colors.text }, style]} />
  );
}
export function Heading({ children }: PropsWithChildren) {
  return (
    <T accessibilityRole="header" style={styles.heading}>
      {children}
    </T>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary,
  danger,
  testID,
  icon,
  compact,
  style,
}: {
  title: string;
  onPress(): void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  testID?: string;
  icon?: ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useSettings();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact
          ? {
              minHeight: 38,
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 10,
            }
          : undefined,
        {
          backgroundColor: secondary ? colors.soft : colors.action,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <T
        style={{
          flex: 1,
          paddingHorizontal: icon ? (compact ? 12 : 18) : 0,
          fontSize: compact ? 11 : 14,
          lineHeight: compact ? 16 : 21,
          textAlign: "center",
          fontFamily: "Manrope_700Bold",
          color: danger
            ? colors.danger
            : secondary
              ? colors.text
              : colors.onAction,
        }}
      >
        {title}
      </T>
      {icon ? (
        <View style={{ position: "absolute", right: compact ? 9 : 22 }}>
          {icon}
        </View>
      ) : null}
    </Pressable>
  );
}
export function Card({ children }: PropsWithChildren) {
  const { colors } = useSettings();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}
export function Screen({
  children,
  scroll = true,
  topSafe = false,
  bottomSafe = true,
  footer,
  header,
  scrollRef,
  contentStyle,
  backgroundColor,
}: PropsWithChildren<{
  scroll?: boolean;
  topSafe?: boolean;
  bottomSafe?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  scrollRef?: React.Ref<import("react-native").ScrollViewInstance>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}>) {
  const { colors } = useSettings();
  return (
    <SafeAreaView
      edges={{
        top: topSafe ? "additive" : "off",
        bottom: bottomSafe ? "additive" : "off",
        left: "additive",
        right: "additive",
      }}
      style={{ flex: 1, backgroundColor: backgroundColor ?? colors.background }}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
          backgroundColor: backgroundColor ?? colors.background,
        }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {header}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, contentStyle]}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
        {footer ? (
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 12,
              backgroundColor: backgroundColor ?? colors.background,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Input({
  label,
  error,
  leading,
  hideLabel = false,
  inputComponent: InputComponent = TextInput,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  leading?: ReactNode;
  hideLabel?: boolean;
  inputComponent?: React.ComponentType<TextInputProps>;
  ref?: ComponentProps<typeof TextInput>["ref"];
}) {
  const { colors } = useSettings();
  return (
    <View style={{ gap: 6 }}>
      {!hideLabel ? (
        <T style={{ fontSize: 13, lineHeight: 19 }}>{label}</T>
      ) : null}
      <View style={{ justifyContent: "center" }}>
        <InputComponent
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.muted}
          {...props}
          style={[
            styles.input,
            {
              color: colors.text,
              paddingLeft: leading ? 44 : 14,
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
            },
            props.style,
          ]}
        />
        {leading ? (
          <View pointerEvents="none" style={{ position: "absolute", left: 14 }}>
            {leading}
          </View>
        ) : null}
      </View>
      {error ? (
        <T accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </T>
      ) : null}
    </View>
  );
}
export function Field<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ...props
}: TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  leading?: ReactNode;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          {...props}
          label={label}
          value={String(field.value ?? "")}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          ref={field.ref}
          error={
            error ??
            (fieldState.error?.message
              ? errorMessage(fieldState.error.message)
              : undefined)
          }
        />
      )}
    />
  );
}
export function Choices<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
}) {
  const { colors } = useSettings();
  return (
    <View style={{ gap: 8 }}>
      <T>{label}</T>
      <View style={styles.wrap}>
        {options.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === item.value }}
            onPress={() => onChange(item.value)}
            style={[
              styles.choice,
              {
                backgroundColor:
                  value === item.value ? colors.action : colors.soft,
              },
            ]}
          >
            <T
              style={{
                color: value === item.value ? colors.onAction : colors.text,
              }}
            >
              {item.label}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function QueryState({
  query,
  children,
  empty,
}: {
  query: { isPending: boolean; isError: boolean; refetch(): unknown };
  children: ReactNode;
  empty?: boolean;
}) {
  if (query.isPending)
    return (
      <View style={styles.content}>
        <ActivityIndicator accessibilityLabel={t("Загрузка")} />
      </View>
    );
  if (query.isError)
    return (
      <Card>
        <Heading>{t("Не получилось открыть данные")}</Heading>
        <T>{t("Проверьте соединение и попробуйте ещё раз.")}</T>
        <Button
          title={t("Повторить")}
          onPress={() => {
            void query.refetch();
          }}
        />
      </Card>
    );
  if (empty)
    return (
      <Card>
        <T>{t("Ближайших событий пока нет.")}</T>
      </Card>
    );
  return children;
}
export function ErrorText({ error }: { error: unknown }) {
  const notify = useNotice();
  const message = error ? errorMessage(error) : undefined;
  useEffect(() => {
    if (message && notify) notify(message);
  }, [error, message, notify]);
  return message && !notify ? (
    <LocalNotice key={message} message={message} />
  ) : null;
}
export function useUnsavedChanges(
  dirty: boolean,
  confirm?: (discard: () => void) => void,
) {
  const [discarded, setDiscarded] = useState(false);
  usePreventRemove(dirty && !discarded, ({ repeat }) => {
    const discard = () => {
      setDiscarded(true);
      repeat();
    };
    if (confirm) {
      confirm(discard);
      return;
    }
    Alert.alert(
      t("Есть несохранённые изменения. Покинуть страницу?"),
      undefined,
      [
        { text: t("Отмена"), style: "cancel" },
        { text: t("Выйти"), style: "destructive", onPress: discard },
      ],
    );
  });
}
export const styles = StyleSheet.create({
  text: { fontFamily: "Manrope_400Regular", fontSize: 14, lineHeight: 21 },
  heading: { fontFamily: "Manrope_800ExtraBold", fontSize: 28, lineHeight: 35 },
  content: { padding: 24, gap: 20, paddingBottom: 28, flexGrow: 1 },
  card: { padding: 18, gap: 14, borderRadius: 24 },
  button: {
    minHeight: 56,
    padding: 16,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minHeight: 48,
  },
});
