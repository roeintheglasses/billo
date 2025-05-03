import React from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Header } from '../organisms/Header';
import { ScreenProps } from '../../types/components';

/**
 * Screen template component for consistent screen layout
 * 
 * Provides a consistent layout structure for screens, including header handling,
 * scrolling behavior, safe area insets, loading states, and pull-to-refresh.
 * 
 * @param {ReactNode} header - Custom header component
 * @param {string} headerTitle - Title to display in the default header
 * @param {ReactNode} headerLeft - Component to display on the left side of header
 * @param {ReactNode} headerRight - Component to display on the right side of header
 * @param {boolean} hideHeader - Whether to hide the header
 * @param {boolean} scrollable - Whether the screen content should be scrollable
 * @param {boolean} safeArea - Whether to use SafeAreaView
 * @param {boolean} loading - Whether to show a loading indicator
 * @param {boolean} refreshing - Whether the screen is currently refreshing
 * @param {function} onRefresh - Function to call when the user pulls to refresh
 * @param {string} backgroundColor - Background color of the screen
 * @param {number|string} padding - Padding for the screen content
 * @returns {React.ReactElement} A styled screen component
 * 
 * @example
 * // Basic usage
 * <Screen headerTitle="Home">
 *   <Text>Screen content goes here</Text>
 * </Screen>
 * 
 * // With custom header and scrolling
 * <Screen 
 *   header={<CustomHeader />}
 *   scrollable
 *   onRefresh={handleRefresh}
 *   refreshing={isRefreshing}
 * >
 *   {content}
 * </Screen>
 */
export const Screen = ({
  children,
  header,
  headerTitle,
  headerLeft,
  headerRight,
  hideHeader = false,
  scrollable = false,
  safeArea = true,
  loading = false,
  refreshing = false,
  onRefresh,
  backgroundColor = '#ffffff',
  padding = 16,
  style,
  ...props
}: ScreenProps) => {
  const Container = safeArea ? SafeAreaView : View;
  const ContentContainer = scrollable ? ScrollView : View;
  
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      );
    }
    
    const contentStyles = [
      styles.contentContainer,
      typeof padding === 'number' || typeof padding === 'string' 
        ? { padding } 
        : null,
      !scrollable && { flex: 1 },
      style
    ];
    
    if (scrollable) {
      return (
        <ContentContainer
          style={contentStyles}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          {...props}
        >
          {children}
        </ContentContainer>
      );
    }
    
    return (
      <ContentContainer style={contentStyles} {...props}>
        {children}
      </ContentContainer>
    );
  };
  
  return (
    <Container style={[styles.container, { backgroundColor }]}>
      {!hideHeader && (
        header || (
          <Header
            title={headerTitle || ''}
            leftComponent={headerLeft}
            rightComponent={headerRight}
          />
        )
      )}
      {renderContent()}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 