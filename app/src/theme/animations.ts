import { Platform } from 'react-native';
import { DURATION, EASING } from '../utils/animationUtils';

/**
 * Defines animation configuration for the theme
 */
const animations = {
  // Duration constants in milliseconds
  duration: {
    fast: DURATION.FAST,
    medium: DURATION.MEDIUM,
    slow: DURATION.SLOW,
  },
  
  // Easing functions
  easing: {
    default: EASING.DEFAULT,
    easeIn: EASING.EASE_IN,
    easeOut: EASING.EASE_OUT,
    easeInOut: EASING.EASE_IN_OUT,
    bounce: EASING.BOUNCE,
  },
  
  // Animation presets for common UI interactions
  presets: {
    fade: {
      in: {
        duration: DURATION.MEDIUM,
        easing: EASING.EASE_OUT,
      },
      out: {
        duration: DURATION.FAST,
        easing: EASING.EASE_IN,
      },
    },
    scale: {
      in: {
        from: 0.95,
        to: 1,
        duration: DURATION.MEDIUM,
        easing: EASING.EASE_OUT,
      },
      out: {
        from: 1,
        to: 0.95,
        duration: DURATION.FAST,
        easing: EASING.EASE_IN,
      },
    },
    slide: {
      distance: {
        small: 10,
        medium: 20,
        large: 50,
      },
      in: {
        duration: DURATION.MEDIUM,
        easing: EASING.EASE_OUT,
      },
      out: {
        duration: DURATION.FAST,
        easing: EASING.EASE_IN,
      },
    },
    button: {
      press: {
        scale: 0.98,
        duration: DURATION.FAST,
        easing: EASING.EASE_IN,
      },
      release: {
        duration: DURATION.FAST,
        easing: EASING.BOUNCE,
      },
    },
    toggle: {
      duration: DURATION.MEDIUM,
      easing: EASING.EASE_IN_OUT,
    },
    modal: {
      in: {
        backdrop: {
          duration: DURATION.MEDIUM,
          easing: EASING.EASE_OUT,
        },
        content: {
          duration: DURATION.MEDIUM,
          easing: EASING.EASE_OUT,
          delay: 50, // Slight delay after backdrop animation starts
        },
      },
      out: {
        backdrop: {
          duration: DURATION.FAST,
          easing: EASING.EASE_IN,
        },
        content: {
          duration: DURATION.FAST,
          easing: EASING.EASE_IN,
          delay: 0,
        },
      },
    },
    list: {
      item: {
        duration: DURATION.FAST,
        staggerDelay: 20, // Delay between items in milliseconds
      },
    },
    transition: {
      screen: {
        duration: Platform.OS === 'ios' ? DURATION.MEDIUM : DURATION.FAST,
        easing: EASING.EASE_IN_OUT,
      },
    },
    notification: {
      in: {
        duration: DURATION.MEDIUM,
        easing: EASING.BOUNCE,
      },
      out: {
        duration: DURATION.MEDIUM,
        easing: EASING.EASE_OUT,
      },
      autoDismiss: 3000, // Auto-dismiss duration in milliseconds
    },
  },
  
  // High-level animation behaviors
  behavior: {
    // Adjustments for reduced motion accessibility setting
    reducedMotion: {
      enabled: true, // Whether to respect reduced motion settings
      scaleFactor: 0.5, // Scale animations to this percentage of normal duration
      fadeOnly: false, // If true, replace all animations with simple fades when reduced motion is enabled
    },
    // Whether animations should run on initial mount
    animateOnMount: true,
    // Default delay between sequential animations
    staggerDelay: 50,
  },
};

export default animations; 