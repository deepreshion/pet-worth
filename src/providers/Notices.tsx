import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet } from "@/components/BottomSheet";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, X } from "lucide-react-native";
import { useSettings } from "./Settings";
import { t } from "@/i18n";
const Context = createContext<((message: string) => void) | null>(null);
export function useNotice() {
  return useContext(Context);
}
export function BottomNotice({
  message,
  onClose,
  visible = true,
}: {
  message: string;
  onClose(): void;
  visible?: boolean;
}) {
  const { colors } = useSettings();
  return (
    <BottomSheet
      visible={visible}
      backdropColor="#00000033"
      backgroundColor={colors.surface}
      statusBarTranslucent
      onRequestClose={onClose}
      onBackdropPress={onClose}
      scrollable
      maxHeightRatio={0.7}
    >
      <BottomSheetScrollView keyboardShouldPersistTaps="handled">
        <SafeAreaView
          edges={["bottom"]}
          style={{
            backgroundColor: colors.surface,
          }}
        >
          <View accessibilityViewIsModal style={{ padding: 24, gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AlertCircle size={26} color={colors.danger} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Закрыть сообщение")}
                onPress={onClose}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 16,
                lineHeight: 24,
                color: colors.text,
              }}
            >
              {message}
            </Text>
          </View>
        </SafeAreaView>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
export function NoticeProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const showNotice = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    setVisible(true);
  }, []);
  return (
    <Context.Provider value={showNotice}>
      {children}
      <BottomNotice
        message={message}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </Context.Provider>
  );
}
export function LocalNotice({ message }: { message: string }) {
  const [closed, setClosed] = useState(false);
  return (
    <BottomNotice
      message={message}
      visible={!closed}
      onClose={() => setClosed(true)}
    />
  );
}
