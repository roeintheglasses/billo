import React from 'react';
import { 
  View, 
  StyleSheet, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { IconButton } from '../../atoms/IconButton';
import { Row } from '../../atoms/Grid';

export interface SubscriptionCardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onPause?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Actions component for SubscriptionCard
 * 
 * @param {function} onEdit - Callback for edit action
 * @param {function} onDelete - Callback for delete action
 * @param {function} onPause - Callback for pause action
 * @returns {React.ReactElement} A subscription card actions component
 */
export const SubscriptionCardActions: React.FC<SubscriptionCardActionsProps> = ({
  onEdit,
  onDelete,
  onPause,
  style,
  testID,
}) => {
  return (
    <View 
      style={[styles.container, style]} 
      testID={testID}
    >
      <Row justifyContent="flex-end" gap={8}>
        {onEdit && (
          <IconButton
            name="pencil"
            variant="ghost"
            size="small"
            onPress={onEdit}
            accessibilityLabel="Edit subscription"
          />
        )}
        
        {onPause && (
          <IconButton
            name="pause-circle"
            variant="ghost"
            size="small"
            onPress={onPause}
            accessibilityLabel="Pause subscription"
          />
        )}
        
        {onDelete && (
          <IconButton
            name="trash-outline"
            variant="ghost"
            size="small"
            onPress={onDelete}
            accessibilityLabel="Delete subscription"
          />
        )}
      </Row>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
});

export default SubscriptionCardActions; 