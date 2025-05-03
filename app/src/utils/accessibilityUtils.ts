import { AccessibilityInfo, Platform, ViewProps } from 'react-native';
import { useState, useEffect } from 'react';

/**
 * Interface for accessibility props to be applied to components
 */
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: ViewProps['accessibilityRole'];
  accessibilityState?: ViewProps['accessibilityState']; 
  accessibilityValue?: ViewProps['accessibilityValue'];
  accessibilityLiveRegion?: ViewProps['accessibilityLiveRegion'];
  accessibilityActions?: ViewProps['accessibilityActions'];
  onAccessibilityAction?: ViewProps['onAccessibilityAction'];
  importantForAccessibility?: ViewProps['importantForAccessibility'];
}

/**
 * Default accessibility roles by component type
 */
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button' as ViewProps['accessibilityRole'],
  LINK: 'link' as ViewProps['accessibilityRole'],
  CHECKBOX: 'checkbox' as ViewProps['accessibilityRole'],
  TOGGLE: 'switch' as ViewProps['accessibilityRole'],
  INPUT: 'textbox' as ViewProps['accessibilityRole'],
  SLIDER: 'adjustable' as ViewProps['accessibilityRole'],
  IMAGE: 'image' as ViewProps['accessibilityRole'],
  HEADER: 'header' as ViewProps['accessibilityRole'],
  ALERT: 'alert' as ViewProps['accessibilityRole'],
  TAB: 'tab' as ViewProps['accessibilityRole'],
  TABLIST: 'tablist' as ViewProps['accessibilityRole'],
  MENU: 'menu' as ViewProps['accessibilityRole'],
  MENUITEM: 'menuitem' as ViewProps['accessibilityRole'],
  PROGRESSBAR: 'progressbar' as ViewProps['accessibilityRole'],
  RADIO: 'radio' as ViewProps['accessibilityRole'],
};

/**
 * Hook to check if screen reader is enabled
 * @returns boolean indicating if screen reader is enabled
 */
export const useScreenReader = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    // Check the current setting
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };

    checkScreenReader();

    // Listen for changes to screen reader setting
    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        setIsScreenReaderEnabled(isEnabled);
      }
    );

    return () => {
      listener.remove();
    };
  }, []);

  return isScreenReaderEnabled;
};

/**
 * Hook to check if screen reader is enabled
 * @returns boolean indicating if bold text is enabled
 */
export const useBoldText = () => {
  const [isBoldTextEnabled, setIsBoldTextEnabled] = useState(false);

  useEffect(() => {
    // This is only available on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    // Check the current setting
    const checkBoldText = async () => {
      const isEnabled = await AccessibilityInfo.isBoldTextEnabled();
      setIsBoldTextEnabled(isEnabled);
    };

    checkBoldText();

    // Listen for changes to bold text setting
    const listener = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      (isEnabled) => {
        setIsBoldTextEnabled(isEnabled);
      }
    );

    return () => {
      listener.remove();
    };
  }, []);

  return isBoldTextEnabled;
};

/**
 * Hook to check if reduce transparency is enabled
 * @returns boolean indicating if reduce transparency is enabled
 */
export const useReduceTransparency = () => {
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);

  useEffect(() => {
    // This is only available on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    // Check the current setting
    const checkReduceTransparency = async () => {
      const isEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      setIsReduceTransparencyEnabled(isEnabled);
    };

    checkReduceTransparency();

    // Listen for changes to reduce transparency setting
    const listener = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (isEnabled) => {
        setIsReduceTransparencyEnabled(isEnabled);
      }
    );

    return () => {
      listener.remove();
    };
  }, []);

  return isReduceTransparencyEnabled;
};

/**
 * Hook that combines all accessibility settings
 * @returns Object with all accessibility settings
 */
export const useAccessibilitySettings = () => {
  const isScreenReaderEnabled = useScreenReader();
  const isReduceMotionEnabled = useReduceMotion();
  const isBoldTextEnabled = useBoldText();
  const isReduceTransparencyEnabled = useReduceTransparency();

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isBoldTextEnabled,
    isReduceTransparencyEnabled,
  };
};

/**
 * Hook to check if reduced motion is enabled
 * @returns boolean indicating if reduced motion is preferred
 */
export const useReduceMotion = () => {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  useEffect(() => {
    // Check the current setting
    const checkReducedMotion = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReduceMotionEnabled(isReduced);
    };

    checkReducedMotion();

    // Listen for changes to reduced motion setting
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isReduced) => {
        setIsReduceMotionEnabled(isReduced);
      }
    );

    return () => {
      listener.remove();
    };
  }, []);

  return isReduceMotionEnabled;
};

/**
 * Generate accessibility props for a button
 * 
 * @param label The accessible label for the button
 * @param hint Optional hint for what the button does
 * @param disabled Whether the button is disabled
 * @returns AccessibilityProps for a button
 */
export const getButtonAccessibilityProps = (
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.BUTTON,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: disabled ? { disabled: true } : undefined,
  };
};

/**
 * Generate accessibility props for a toggle/switch
 * 
 * @param label The accessible label for the toggle
 * @param checked Whether the toggle is checked/on
 * @param hint Optional hint for what the toggle controls
 * @returns AccessibilityProps for a toggle/switch
 */
export const getToggleAccessibilityProps = (
  label: string,
  checked: boolean,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.TOGGLE,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { checked },
  };
};

/**
 * Generate accessibility props for an input field
 * 
 * @param label The accessible label for the input
 * @param hint Optional hint for what information to enter
 * @param required Whether the input is required
 * @param disabled Whether the input is disabled
 * @returns AccessibilityProps for an input field
 */
export const getInputAccessibilityProps = (
  label: string,
  hint?: string,
  required?: boolean,
  disabled?: boolean
): AccessibilityProps => {
  // Create an accessibility state object with valid properties
  const accessibilityState: ViewProps['accessibilityState'] = {};
  
  if (disabled) {
    accessibilityState.disabled = true;
  }
  
  // Note: 'required' is not a standard property in accessibilityState
  // We can add it as part of the label instead for screen readers
  const accessibilityLabel = required 
    ? `${label}, required` 
    : label;

  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.INPUT,
    accessibilityLabel,
    accessibilityHint: hint,
    accessibilityState,
  };
};

/**
 * Generate accessibility props for an image
 * 
 * @param description Description of the image
 * @param isDecorative Whether the image is purely decorative
 * @returns AccessibilityProps for an image
 */
export const getImageAccessibilityProps = (
  description: string,
  isDecorative?: boolean
): AccessibilityProps => {
  if (isDecorative) {
    return {
      accessible: false,
      accessibilityRole: ACCESSIBILITY_ROLES.IMAGE,
      importantForAccessibility: 'no-hide-descendants',
    };
  }

  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.IMAGE,
    accessibilityLabel: description,
  };
};

/**
 * Generate accessibility props for a header
 * 
 * @param title The title of the header
 * @returns AccessibilityProps for a header
 */
export const getHeaderAccessibilityProps = (title: string): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.HEADER,
    accessibilityLabel: title,
  };
};

/**
 * Generate accessibility props for a progress bar
 * 
 * @param label The accessible label for the progress bar
 * @param value Current progress value (0-1)
 * @param min Minimum value (default: 0)
 * @param max Maximum value (default: 100)
 * @returns AccessibilityProps for a progress bar
 */
export const getProgressBarAccessibilityProps = (
  label: string,
  value: number,
  min: number = 0,
  max: number = 100
): AccessibilityProps => {
  const currentValue = Math.round(value * 100);
  
  return {
    accessible: true,
    accessibilityRole: ACCESSIBILITY_ROLES.PROGRESSBAR,
    accessibilityLabel: label,
    accessibilityValue: {
      min,
      max,
      now: currentValue,
      text: `${currentValue}%`,
    },
  };
};

/**
 * Announce a message to screen readers
 * 
 * @param message The message to announce
 */
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Function to get the optimal minimum touch target size
 * based on platform and accessibility guidelines
 * 
 * @returns Minimum touch target size in pixels
 */
export const getMinimumTouchTargetSize = (): number => {
  // 44x44 points is the recommended minimum size for iOS
  // 48x48 dp is the recommended minimum size for Android
  return Platform.OS === 'ios' ? 44 : 48;
};

/**
 * Generate a color with sufficient contrast to the background
 * based on WCAG guidelines
 * 
 * @param backgroundColor The background color in hex format
 * @param darkColor Dark color to use (default: '#000000')
 * @param lightColor Light color to use (default: '#FFFFFF')
 * @returns Color with sufficient contrast
 */
export const getAccessibleTextColor = (
  backgroundColor: string,
  darkColor: string = '#000000',
  lightColor: string = '#FFFFFF'
): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using the formula for sRGB
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  
  // Return dark text on light backgrounds and light text on dark backgrounds
  // The threshold 0.5 is a simple midpoint, but could be adjusted
  return luminance > 0.5 ? darkColor : lightColor;
};

/**
 * Get contrast ratio between two colors
 * Based on WCAG 2.0 formula
 * 
 * @param color1 First color in hex format
 * @param color2 Second color in hex format
 * @returns Contrast ratio (1-21)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  // Get relative luminance for both colors
  const getLuminance = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Convert RGB to relative luminance
    const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  
  const L1 = getLuminance(color1);
  const L2 = getLuminance(color2);
  
  // Calculate contrast ratio
  const contrastRatio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  
  return contrastRatio;
};

/**
 * Check if a color combination meets WCAG contrast requirements
 * 
 * @param foreground Foreground color in hex format
 * @param background Background color in hex format
 * @param level WCAG level to check against ('AA' or 'AAA')
 * @param isLargeText Whether the text is considered large (>=18pt or >=14pt bold)
 * @returns Whether the contrast meets the specified WCAG level
 */
export const meetsContrastRequirements = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  // WCAG 2.0 contrast ratio requirements
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3.0,
    },
    AAA: {
      normal: 7.0,
      large: 4.5,
    },
  };
  
  const threshold = isLargeText 
    ? requirements[level].large 
    : requirements[level].normal;
  
  return ratio >= threshold;
}; 