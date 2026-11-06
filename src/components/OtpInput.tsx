import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { T } from "@/components/ui";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import { OTP_LENGTH } from "@/utils/emailOtp";

/** A single native input preserves paste, autofill, backspace and accessibility. */
export function OtpInput({
  value,
  onChange,
  invalid,
  disabled,
}: {
  value: string;
  onChange(value: string): void;
  invalid: boolean;
  disabled: boolean;
}) {
  const { colors } = useSettings();
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(value.length);
  return (
    <View style={styles.container}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.digits}
      >
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <View
            key={index}
            style={[
              styles.cell,
              {
                backgroundColor: colors.surface,
                borderColor: invalid
                  ? colors.danger
                  : focused && index === Math.min(cursor, OTP_LENGTH - 1)
                    ? colors.text
                    : colors.border,
                borderWidth:
                  focused && index === Math.min(cursor, OTP_LENGTH - 1) ? 2 : 1,
              },
            ]}
          >
            <T style={styles.digit}>{value[index] ?? ""}</T>
            {focused && index === cursor && !value[index] ? (
              <View style={[styles.caret, { backgroundColor: colors.text }]} />
            ) : null}
          </View>
        ))}
      </View>
      <TextInput
        testID="otp-input"
        accessibilityLabel={t("Код для входа")}
        accessibilityHint={t("Введите 6 цифр из письма")}
        value={value}
        onChangeText={(text) => {
          const next = text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
          setCursor(next.length);
          onChange(next);
        }}
        onSelectionChange={({ nativeEvent }) =>
          setCursor(nativeEvent.selection.start)
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        caretHidden
        selectionColor="transparent"
        style={styles.nativeInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 56 },
  digits: { flexDirection: "row", gap: 6, height: 56 },
  cell: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: { fontSize: 22, lineHeight: 30, fontFamily: "Manrope_600SemiBold" },
  caret: { position: "absolute", width: 2, height: 25 },
  nativeInput: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    color: "transparent",
    backgroundColor: "transparent",
    fontSize: 22,
  },
});
