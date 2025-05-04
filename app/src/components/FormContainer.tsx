import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface FormContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  style?: object;
  showTitle?: boolean;
}

/**
 * FormContainer Component
 *
 * A container for forms with flexible options for scrolling and keyboard behavior.
 */
export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  title,
  subtitle,
  scrollable = true,
  keyboardAvoiding = true,
  style,
  showTitle = true,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  // Determine the appropriate component for content
  const ContentComponent = scrollable ? ScrollView : View;

  // Main form content
  const formContent = (
    <ContentComponent
      style={[
        styles.container,
        { backgroundColor: colors.background.primary, padding: spacing.screenPadding },
        style,
      ]}
      contentContainerStyle={scrollable ? styles.contentContainer : undefined}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {title && showTitle && (
        <Text
          style={[
            styles.title,
            {
              color: colors.text.primary,
              fontSize: typography.fontSize.xxl,
              fontWeight: '700',
              marginBottom: subtitle ? spacing.sm : spacing.md,
            },
          ]}
        >
          {title}
        </Text>
      )}

      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.text.secondary,
              fontSize: typography.fontSize.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}

      {children}
    </ContentComponent>
  );

  // Wrap with KeyboardAvoidingView if needed
  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {formContent}
      </KeyboardAvoidingView>
    );
  }

  return formContent;
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
