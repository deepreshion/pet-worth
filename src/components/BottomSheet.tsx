import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  Modal,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";

/** Native modal keeps sheets above navigation; Gorhom coordinates pan and scroll. */
export function BottomSheet({
  visible,
  avoidKeyboard = false,
  onRequestClose,
  backdropColor,
  backgroundColor,
  contentStyle,
  onBackdropPress,
  statusBarTranslucent,
  scrollable = false,
  maxHeightRatio = 0.9,
  children,
}: PropsWithChildren<{
  visible: boolean;
  avoidKeyboard?: boolean;
  onRequestClose(): void;
  backdropColor: string;
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  onBackdropPress?(): void;
  statusBarTranslucent?: boolean;
  scrollable?: boolean;
  maxHeightRatio?: number;
}>) {
  const { colors } = useSettings();
  const { height } = useWindowDimensions();
  const [presented, setPresented] = useState(false);
  const sheet = useRef<GorhomBottomSheet>(null);

  useEffect(() => {
    if (!visible) sheet.current?.close();
  }, [visible]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[props.style, { backgroundColor: backdropColor }]}
        pressBehavior="close"
        onPress={onBackdropPress}
        accessible
        accessibilityLabel={t("Закрыть")}
      />
    ),
    [backdropColor, onBackdropPress],
  );

  return (
    <Modal
      testID="bottom-sheet-modal"
      visible={visible || presented}
      transparent
      statusBarTranslucent={statusBarTranslucent}
      animationType="none"
      onShow={() => setPresented(true)}
      onRequestClose={onRequestClose}
    >
      <GestureHandlerRootView style={styles.container}>
        {visible || presented ? (
          <GorhomBottomSheet
            ref={sheet}
            accessible={false}
            index={0}
            enableDynamicSizing
            maxDynamicContentSize={height * maxHeightRatio}
            enablePanDownToClose
            enableContentPanningGesture
            enableHandlePanningGesture
            keyboardBehavior={avoidKeyboard ? "interactive" : "extend"}
            keyboardBlurBehavior="restore"
            enableBlurKeyboardOnGesture
            android_keyboardInputMode="adjustResize"
            backdropComponent={backdrop}
            backgroundStyle={{
              backgroundColor: backgroundColor ?? colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
            }}
            handleIndicatorStyle={{ backgroundColor: colors.border }}
            onClose={() => {
              setPresented(false);
              if (visible) onRequestClose();
            }}
          >
            {scrollable ? (
              children
            ) : (
              <BottomSheetView style={contentStyle} accessibilityViewIsModal>
                {children}
              </BottomSheetView>
            )}
          </GorhomBottomSheet>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
