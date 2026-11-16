import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { gameTheme } from "../theme/gameTheme";

type SplashScreenProps = {
  onFinish: () => void;
};

// مدت نمایش کمی طولانی‌تر تا برند Lifelands فرصت دیده‌شدن داشته باشد
const SPLASH_DURATION_MS = 3200;
const { colors } = gameTheme;

// رنگ اختصاصی Lifelands (بنفش)
const LIFELANDS_ACCENT = "#b06bff";
const LIFELANDS_GLOW = "rgba(176,107,255,0.55)";
const LIFELANDS_SHADOW = "rgba(176,107,255,0.85)";

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  // انیمیشن‌های برند Lifelands
  const poweredOpacity = useRef(new Animated.Value(0)).current;
  const poweredTranslateY = useRef(new Animated.Value(16)).current;
  const poweredScale = useRef(new Animated.Value(0.92)).current;
  const shineTranslate = useRef(new Animated.Value(-1)).current;
  const markRotate = useRef(new Animated.Value(0)).current;

  const onFinishRef = useRef(onFinish);
  const finishedRef = useRef(false);

  const [introElapsed, setIntroElapsed] = useState(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    let disposed = false;
    let animation: Animated.CompositeAnimation | undefined;
    let poweredAnimation: Animated.CompositeAnimation | undefined;
    let shineLoop: Animated.CompositeAnimation | undefined;
    let markLoop: Animated.CompositeAnimation | undefined;

    async function animateIntro() {
      let reduceMotion = false;

      try {
        reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      } catch {
        // اگر خواندن تنظیمات در دسترس نبود،
        // از انیمیشن سادهٔ پیش‌فرض استفاده می‌کنیم.
      }

      if (disposed) {
        return;
      }

      if (reduceMotion) {
        opacity.setValue(1);
        translateY.setValue(0);
        poweredOpacity.setValue(1);
        poweredTranslateY.setValue(0);
        poweredScale.setValue(1);
        return;
      }

      // برند اصلی
      animation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ]);
      animation.start();

      // برند Lifelands با تأخیر
      poweredAnimation = Animated.sequence([
        Animated.delay(520),
        Animated.parallel([
          Animated.timing(poweredOpacity, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(poweredTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.spring(poweredScale, {
            toValue: 1,
            friction: 6,
            tension: 70,
            useNativeDriver: true,
          }),
        ]),
      ]);
      poweredAnimation.start();

      // درخشش متحرک روی متن Lifelands (هر ~4.5 ثانیه)
      shineLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(shineTranslate, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shineTranslate, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(1400),
        ]),
      );
      shineLoop.start();

      // چرخش آرام الماس Lifelands
      markLoop = Animated.loop(
        Animated.timing(markRotate, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      markLoop.start();
    }

    void animateIntro();

    const timer = setTimeout(() => {
      setIntroElapsed(true);
    }, SPLASH_DURATION_MS);

    return () => {
      disposed = true;
      clearTimeout(timer);
      animation?.stop();
      poweredAnimation?.stop();
      shineLoop?.stop();
      markLoop?.stop();
    };
  }, [
    opacity,
    translateY,
    poweredOpacity,
    poweredTranslateY,
    poweredScale,
    shineTranslate,
    markRotate,
  ]);

  useEffect(() => {
    if (!introElapsed) {
      return;
    }

    function finishIfActive() {
      if (AppState.currentState !== "active" || finishedRef.current) {
        return;
      }

      finishedRef.current = true;
      onFinishRef.current();
    }

    const subscription = AppState.addEventListener("change", finishIfActive);

    finishIfActive();

    return () => subscription.remove();
  }, [introElapsed]);

  const shineTranslateX = useMemo(
    () =>
      shineTranslate.interpolate({
        inputRange: [-1, 1],
        outputRange: [-120, 220],
      }),
    [shineTranslate],
  );

  // چرخش ۳۶۰ درجه برای الماس (کند و آرام)
  const markRotateDeg = useMemo(
    () =>
      markRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["45deg", "405deg"],
      }),
    [markRotate],
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View
        pointerEvents="none"
        accessible={false}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.rightPanel} />
        <View style={styles.diagonalStripe} />

        <View style={styles.topLine} />
        <View style={styles.bottomLine} />

        <View style={[styles.corner, styles.topLeftCorner]} />
        <View style={[styles.corner, styles.bottomRightCorner]} />
      </View>

      <Animated.View
        style={[
          styles.brand,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.emblem} accessible={false} pointerEvents="none">
          <View style={styles.emblemInner} />
          <View style={styles.crosshairHorizontal} />
          <View style={styles.crosshairVertical} />
          <View style={styles.crosshairDot} />
        </View>

        <Text
          accessibilityRole="header"
          accessibilityLabel="Local Army"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={styles.title}
        >
          LOCAL<Text style={styles.titleAccent}>ARMY</Text>
        </Text>

        <View style={styles.separator} />

        <Text style={styles.tagline}>ENTER THE BATTLEFIELD</Text>
      </Animated.View>

      {/* ============================================================
          Powered by Lifelands (بنفش)
         ============================================================ */}
      <Animated.View
        accessible
        accessibilityRole="text"
        accessibilityLabel="Powered by Lifelands"
        style={[
          styles.poweredWrap,
          {
            opacity: poweredOpacity,
            transform: [
              { translateY: poweredTranslateY },
              { scale: poweredScale },
            ],
          },
        ]}
      >
        <View style={styles.poweredDivider}>
          <View style={styles.poweredDividerLine} />
          <View style={styles.poweredDividerDot} />
          <View style={styles.poweredDividerLine} />
        </View>

        <View style={styles.poweredRow}>
          {/* لوگوی Lifelands: الماس چرخان با نقطهٔ مرکزی */}
          <View style={styles.lifelandsMark} pointerEvents="none">
            <Animated.View
              style={[
                styles.lifelandsDiamondOuter,
                { transform: [{ rotate: markRotateDeg }] },
              ]}
            >
              <View style={styles.lifelandsDiamondInner} />
            </Animated.View>
            <View style={styles.lifelandsDot} />
          </View>

          <View style={styles.poweredTextWrap}>
            <View style={styles.poweredShineClip} pointerEvents="none">
              <Animated.View
                style={[
                  styles.poweredShine,
                  { transform: [{ translateX: shineTranslateX }] },
                ]}
              />
            </View>
            <Text style={styles.poweredLabel}>POWERED BY</Text>
            <Text style={styles.poweredBrand}>
              LIFE
              <Text style={styles.poweredBrandAccent}>LANDS</Text>
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>LOCAL COMBAT · SINGLE PLAYER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  rightPanel: {
    position: "absolute",
    top: "-40%",
    bottom: "-40%",
    right: "-15%",
    width: "50%",
    backgroundColor: colors.panelDark,
    transform: [{ rotate: "22deg" }],
  },

  diagonalStripe: {
    position: "absolute",
    top: "-40%",
    bottom: "-40%",
    right: "28%",
    width: 2,
    backgroundColor: colors.accentSoft,
    transform: [{ rotate: "22deg" }],
  },

  topLine: {
    position: "absolute",
    top: 22,
    left: "9%",
    right: "9%",
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.45,
  },

  bottomLine: {
    position: "absolute",
    bottom: 22,
    left: "9%",
    right: "9%",
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.45,
  },

  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: colors.accent,
    opacity: 0.75,
  },

  topLeftCorner: {
    top: 35,
    left: 35,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },

  bottomRightCorner: {
    right: 35,
    bottom: 35,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },

  brand: {
    alignItems: "center",
    width: "76%",
    maxWidth: 640,
  },

  emblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emblemInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  crosshairHorizontal: {
    position: "absolute",
    width: 78,
    height: 1,
    backgroundColor: colors.accent,
  },

  crosshairVertical: {
    position: "absolute",
    width: 1,
    height: 78,
    backgroundColor: colors.accent,
  },

  crosshairDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  title: {
    color: colors.text,
    fontSize: 50,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
  },

  titleAccent: {
    color: colors.accent,
  },

  separator: {
    width: 64,
    height: 3,
    backgroundColor: colors.accent,
    marginTop: 12,
    marginBottom: 12,
  },

  tagline: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
    textAlign: "center",
  },

  /* ============================================================
     Powered by Lifelands — بنفش
     ============================================================ */
  poweredWrap: {
    marginTop: 28,
    alignItems: "center",
    width: "76%",
    maxWidth: 640,
  },

  poweredDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 160,
    marginBottom: 14,
  },

  poweredDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
  },

  poweredDividerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: LIFELANDS_ACCENT,
    marginHorizontal: 8,
    shadowColor: LIFELANDS_ACCENT,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  poweredRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  lifelandsMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  lifelandsDiamondOuter: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: LIFELANDS_ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LIFELANDS_ACCENT,
    shadowOpacity: 0.85,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },

  lifelandsDiamondInner: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: LIFELANDS_SHADOW,
  },

  lifelandsDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIFELANDS_ACCENT,
    shadowColor: LIFELANDS_ACCENT,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  poweredTextWrap: {
    position: "relative",
    alignItems: "flex-start",
  },

  poweredShineClip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },

  poweredShine: {
    position: "absolute",
    top: -6,
    bottom: -6,
    width: 40,
    backgroundColor: LIFELANDS_GLOW,
    opacity: 0.55,
    transform: [{ skewX: "-22deg" }],
  },

  poweredLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 4,
    marginBottom: 2,
  },

  poweredBrand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
  },

  poweredBrandAccent: {
    color: LIFELANDS_ACCENT,
    textShadowColor: LIFELANDS_SHADOW,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },

  footer: {
    position: "absolute",
    bottom: 35,
    left: "15%",
    right: "15%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 8,
  },

  footerText: {
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
