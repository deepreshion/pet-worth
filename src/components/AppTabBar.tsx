import { Pressable, StyleSheet, View } from "react-native";
import type { ComponentRef, Ref } from "react";
import {
  BottomTabBar,
  type BottomTabBarButtonProps,
  type BottomTabBarProps,
} from "expo-router/js-tabs";
import { useSettings } from "@/providers/Settings";

export function AppTabBar(props: BottomTabBarProps) {
  const { colors } = useSettings();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        paddingLeft: props.insets.left,
        paddingRight: props.insets.right,
        paddingBottom: props.insets.bottom,
      }}
    >
      <BottomTabBar
        {...props}
        insets={{ top: 0, bottom: 0, left: 12, right: 12 }}
      />
    </View>
  );
}

export function AppTabButton({
  style,
  ref,
  ...props
}: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      android_ripple={undefined}
      ref={ref as Ref<ComponentRef<typeof Pressable>>}
      style={[style, appTabStyles.button]}
    />
  );
}

export const appTabStyles = StyleSheet.create({
  bar: {
    height: 54,
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  item: { marginHorizontal: 0 },
  icon: { width: 24, height: 24, flex: 0 },
  label: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  button: {
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    paddingVertical: 0,
  },
});
