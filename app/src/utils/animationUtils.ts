import { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  EasingFunction,
  ViewStyle,
  StyleProp,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  WithTimingConfig,
  WithSpringConfig,
} from 'react-native-reanimated';

/**
 * Standard animation durations in milliseconds
 */
export const DURATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
};

/**
 * Standard easing presets
 */
export const EASING = {
  DEFAULT: Easing.bezier(0.25, 0.1, 0.25, 1), // Default cubic bezier
  EASE_IN: Easing.in(Easing.ease),
  EASE_OUT: Easing.out(Easing.ease),
  EASE_IN_OUT: Easing.inOut(Easing.ease),
  BOUNCE: Easing.bezier(0.175, 0.885, 0.32, 1.275),
};

/**
 * Animation timing configuration presets
 */
export const TIMING_CONFIG = {
  DEFAULT: {
    duration: DURATION.MEDIUM,
    easing: EASING.DEFAULT,
  },
  FAST: {
    duration: DURATION.FAST,
    easing: EASING.DEFAULT,
  },
  SLOW: {
    duration: DURATION.SLOW,
    easing: EASING.DEFAULT,
  },
  BOUNCE: {
    duration: DURATION.MEDIUM,
    easing: EASING.BOUNCE,
  },
};

/**
 * Animation spring configuration presets
 */
export const SPRING_CONFIG = {
  DEFAULT: {
    damping: 10,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  BOUNCY: {
    damping: 8,
    mass: 1,
    stiffness: 80,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  GENTLE: {
    damping: 15,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

/**
 * Hook to check if reduced motion is enabled
 * @returns boolean indicating if reduced motion is preferred
 */
export const useReducedMotion = () => {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    // Check the current setting
    const checkReducedMotion = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(isReduced);
    };

    checkReducedMotion();

    // Listen for changes to reduced motion setting
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', isReduced => {
      setIsReducedMotionEnabled(isReduced);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return isReducedMotionEnabled;
};

/**
 * Hook to create a fade animation using Reanimated
 *
 * @param visible Whether the element should be visible
 * @param config Animation timing configuration
 * @returns Animated style object for fade animation
 */
export const useFadeAnimation = (
  visible: boolean,
  config: WithTimingConfig = TIMING_CONFIG.DEFAULT
) => {
  const opacity = useSharedValue(visible ? 1 : 0);
  const isReducedMotion = useReducedMotion();

  // If reduced motion is enabled, use shorter duration
  const adjustedConfig = isReducedMotion
    ? { ...config, duration: Math.min(config.duration || DURATION.MEDIUM, DURATION.FAST) }
    : config;

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, adjustedConfig);
  }, [visible, opacity, adjustedConfig]);

  return useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
};

/**
 * Hook to create a slide animation using Reanimated
 *
 * @param visible Whether the element should be visible
 * @param direction Direction to slide from ('left', 'right', 'top', 'bottom')
 * @param distance Distance to slide (default: 20)
 * @param config Animation timing configuration
 * @returns Animated style object for slide animation
 */
export const useSlideAnimation = (
  visible: boolean,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
  distance: number = 20,
  config: WithTimingConfig = TIMING_CONFIG.DEFAULT
) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isReducedMotion = useReducedMotion();

  // If reduced motion is enabled, use shorter duration
  const adjustedConfig = isReducedMotion
    ? { ...config, duration: Math.min(config.duration || DURATION.MEDIUM, DURATION.FAST) }
    : config;

  // If reduced motion is enabled, reduce the distance
  const adjustedDistance = isReducedMotion ? Math.min(distance, 10) : distance;

  useEffect(() => {
    switch (direction) {
      case 'left':
        translateX.value = withTiming(visible ? 0 : -adjustedDistance, adjustedConfig);
        break;
      case 'right':
        translateX.value = withTiming(visible ? 0 : adjustedDistance, adjustedConfig);
        break;
      case 'top':
        translateY.value = withTiming(visible ? 0 : -adjustedDistance, adjustedConfig);
        break;
      case 'bottom':
        translateY.value = withTiming(visible ? 0 : adjustedDistance, adjustedConfig);
        break;
    }
  }, [visible, direction, translateX, translateY, adjustedDistance, adjustedConfig]);

  return useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
  });
};

/**
 * Hook to create a scale animation using Reanimated
 *
 * @param visible Whether the element should be visible
 * @param initialScale Initial scale value (default: 0.9)
 * @param config Animation timing configuration
 * @returns Animated style object for scale animation
 */
export const useScaleAnimation = (
  visible: boolean,
  initialScale: number = 0.9,
  config: WithTimingConfig = TIMING_CONFIG.DEFAULT
) => {
  const scale = useSharedValue(visible ? 1 : initialScale);
  const isReducedMotion = useReducedMotion();

  // If reduced motion is enabled, use shorter duration and less dramatic scaling
  const adjustedConfig = isReducedMotion
    ? { ...config, duration: Math.min(config.duration || DURATION.MEDIUM, DURATION.FAST) }
    : config;
  const adjustedInitialScale = isReducedMotion ? Math.max(initialScale, 0.95) : initialScale;

  useEffect(() => {
    scale.value = withTiming(visible ? 1 : adjustedInitialScale, adjustedConfig);
  }, [visible, scale, adjustedInitialScale, adjustedConfig]);

  return useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
};

/**
 * Hook to create a combined fade and scale animation using Reanimated
 *
 * @param visible Whether the element should be visible
 * @param initialScale Initial scale value (default: 0.9)
 * @param config Animation timing configuration
 * @returns Animated style object for combined fade and scale animation
 */
export const useFadeScaleAnimation = (
  visible: boolean,
  initialScale: number = 0.9,
  config: WithTimingConfig = TIMING_CONFIG.DEFAULT
) => {
  const opacity = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(visible ? 1 : initialScale);
  const isReducedMotion = useReducedMotion();

  // If reduced motion is enabled, adjust animation parameters
  const adjustedConfig = isReducedMotion
    ? { ...config, duration: Math.min(config.duration || DURATION.MEDIUM, DURATION.FAST) }
    : config;
  const adjustedInitialScale = isReducedMotion ? Math.max(initialScale, 0.95) : initialScale;

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, adjustedConfig);
    scale.value = withTiming(visible ? 1 : adjustedInitialScale, adjustedConfig);
  }, [visible, opacity, scale, adjustedInitialScale, adjustedConfig]);

  return useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });
};

/**
 * Hook to create a spring animation using Reanimated
 *
 * @param active Whether the animation is active
 * @param activeValue Value when active (default: 1)
 * @param inactiveValue Value when inactive (default: 0)
 * @param config Spring configuration
 * @returns Animated value and reset function
 */
export const useSpringAnimation = (
  active: boolean,
  activeValue: number = 1,
  inactiveValue: number = 0,
  config: Partial<WithSpringConfig> = SPRING_CONFIG.DEFAULT
) => {
  const animatedValue = useSharedValue(active ? activeValue : inactiveValue);
  const isReducedMotion = useReducedMotion();

  // Create a basic spring config with safe defaults
  const baseSpringConfig = {
    damping: config.damping || 10,
    mass: config.mass || 1,
    stiffness: config.stiffness || 100,
    overshootClamping: config.overshootClamping || false,
    restDisplacementThreshold: config.restDisplacementThreshold || 0.01,
    restSpeedThreshold: config.restSpeedThreshold || 0.01,
  };

  // Apply reduced motion adjustments if needed
  const springConfig = isReducedMotion
    ? {
        ...baseSpringConfig,
        damping: Math.max(baseSpringConfig.damping, 15),
        stiffness: Math.max(baseSpringConfig.stiffness, 120),
      }
    : baseSpringConfig;

  useEffect(() => {
    animatedValue.value = withSpring(active ? activeValue : inactiveValue, springConfig);
  }, [active, activeValue, inactiveValue, animatedValue, springConfig]);

  // Manually reset the animation value
  const reset = (value: number = inactiveValue) => {
    animatedValue.value = value;
  };

  return { animatedValue, reset };
};

/**
 * Utility class for Legacy Animated API animations
 * Useful for components that haven't been migrated to Reanimated yet
 */
export class AnimationUtils {
  /**
   * Create a timing animation with the Animated API
   *
   * @param value Animated value to animate
   * @param toValue Target value
   * @param duration Animation duration in ms
   * @param easing Easing function
   * @returns Animated.CompositeAnimation that can be started, stopped, etc.
   */
  static timing(
    value: Animated.Value | Animated.ValueXY,
    toValue: number | { x: number; y: number },
    duration: number = DURATION.MEDIUM,
    easing: EasingFunction = EASING.DEFAULT
  ) {
    return Animated.timing(value, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  }

  /**
   * Create a spring animation with the Animated API
   *
   * @param value Animated value to animate
   * @param toValue Target value
   * @param friction Spring friction (default: 7)
   * @param tension Spring tension (default: 40)
   * @returns Animated.CompositeAnimation that can be started, stopped, etc.
   */
  static spring(
    value: Animated.Value | Animated.ValueXY,
    toValue: number | { x: number; y: number },
    friction: number = 7,
    tension: number = 40
  ) {
    return Animated.spring(value, {
      toValue,
      friction,
      tension,
      useNativeDriver: true,
    });
  }

  /**
   * Create a sequence of animations with the Animated API
   *
   * @param animations Array of Animated.CompositeAnimation
   * @returns Animated.CompositeAnimation that can be started, stopped, etc.
   */
  static sequence(animations: Animated.CompositeAnimation[]) {
    return Animated.sequence(animations);
  }

  /**
   * Create a parallel animation with the Animated API
   *
   * @param animations Array of Animated.CompositeAnimation
   * @returns Animated.CompositeAnimation that can be started, stopped, etc.
   */
  static parallel(animations: Animated.CompositeAnimation[]) {
    return Animated.parallel(animations);
  }
}

/**
 * Function to determine if animations should be reduced/disabled
 * based on device accessibility settings and app preferences
 *
 * @param forceDisable Force disable animations
 * @returns Whether animations should be reduced/disabled
 */
export const shouldReduceAnimations = async (forceDisable = false): Promise<boolean> => {
  if (forceDisable) return true;
  return await AccessibilityInfo.isReduceMotionEnabled();
};
