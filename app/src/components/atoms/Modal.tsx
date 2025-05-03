import React, { useEffect } from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from './Card';

export type ModalSize = 'small' | 'medium' | 'large' | 'full';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  title?: string;
  dismissable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  animationType?: 'none' | 'slide' | 'fade';
  testID?: string;
}

/**
 * Modal component for displaying content as an overlay
 * 
 * @param {boolean} visible - Whether the modal is visible
 * @param {function} onClose - Function to call when modal is closed
 * @param {ReactNode} children - Content to display in the modal
 * @param {string} size - Size of the modal ('small', 'medium', 'large', 'full')
 * @param {boolean} dismissable - Whether the modal can be dismissed by tapping backdrop
 * @param {object} contentContainerStyle - Additional styles for the modal content container
 * @param {string} animationType - Type of animation when modal opens/closes
 * @returns {React.ReactElement} A modal component
 * 
 * @example
 * // Basic usage
 * <Modal visible={isVisible} onClose={() => setIsVisible(false)}>
 *   <Text>Modal content</Text>
 * </Modal>
 * 
 * // Custom size and non-dismissable
 * <Modal
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   size="large"
 *   dismissable={false}
 * >
 *   <Text>You must take action to close this</Text>
 *   <Button title="Close" onPress={() => setIsVisible(false)} />
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  size = 'medium',
  dismissable = true,
  contentContainerStyle,
  animationType = 'fade',
  testID,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { width, height } = useWindowDimensions();
  
  // Animation state
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  // Handle animation on visibility change
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Determine modal width based on size
  const getModalWidth = (): DimensionValue => {
    switch (size) {
      case 'small':
        return '70%';
      case 'medium':
        return '85%';
      case 'large':
        return '95%';
      case 'full':
        return '100%';
      default:
        return '85%';
    }
  };

  // Get max height based on size
  const getMaxHeight = (): DimensionValue => {
    return size === 'full' ? '100%' : '90%';
  };

  // Modal container styles
  const modalContainerStyle: StyleProp<ViewStyle> = [
    styles.modalContainer,
    {
      width: getModalWidth(),
      maxHeight: getMaxHeight(),
      backgroundColor: colors.background.primary,
    },
    contentContainerStyle,
  ];

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="none" // We're using our own animations
      onRequestClose={onClose}
      statusBarTranslucent
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={() => dismissable && onClose()}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalView,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Card style={modalContainerStyle} variant="elevated" radius={size === 'full' ? 0 : 12}>
            {children}
          </Card>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalView: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  modalContainer: {
    overflow: 'hidden',
  },
});

export default Modal; 