import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";

const originalCat = require("../../assets/loader/pinterest-cat-original.gif");
const originalStill = require("../../assets/loader/pinterest-cat-still.png");
const inlineCat = require("../../assets/loader/cat-inline.webp");
const inlineStill = require("../../assets/loader/cat-inline-still.png");
const darkCat = require("../../assets/loader/cat-inline-dark.webp");
const darkStill = require("../../assets/loader/cat-inline-dark-still.png");
const viewport = { x: 400, y: 300, width: 412, height: 205 };

export function CatLoader({
  variant = "inline",
  size,
  label = t("Загрузка"),
  onReady,
}: {
  variant?: "fullscreen" | "inline";
  size?: number;
  label?: string;
  onReady?: () => void;
}) {
  const { dark } = useSettings();
  const { width } = useWindowDimensions();
  const fullscreen = variant === "fullscreen";
  const catWidth = fullscreen
    ? Math.min(size ?? 140, Math.max(1, width - 48))
    : (size ?? 64);
  const scale = catWidth / viewport.width;
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        preferenceChanged = true;
        setReduceMotion(value);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted && !preferenceChanged) setReduceMotion(value);
      })
      .catch(() => {
        /* Keep the static frame if the preference is unavailable. */
      });
    const app = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);
  const animate = active && !reduceMotion;
  const imageSource = fullscreen
    ? animate
      ? originalCat
      : originalStill
    : dark
      ? animate
        ? darkCat
        : darkStill
      : animate
        ? inlineCat
        : inlineStill;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={[styles.container, fullscreen && styles.fullscreen]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: catWidth,
          height: viewport.height * scale,
          overflow: "hidden",
        }}
      >
        <Image
          source={imageSource}
          autoplay={animate}
          useAppleWebpCodec={false}
          contentFit="fill"
          transition={0}
          accessible={false}
          onLoadEnd={onReady}
          style={
            fullscreen
              ? {
                  position: "absolute",
                  width: 1240 * scale,
                  height: 698 * scale,
                  left: -viewport.x * scale,
                  top: -viewport.y * scale,
                }
              : { width: catWidth, height: viewport.height * scale }
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  fullscreen: { flex: 1, width: "100%", backgroundColor: "#FFFFFF" },
});
