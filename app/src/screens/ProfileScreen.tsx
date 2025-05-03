import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { FormContainer, FormInput, Button } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/auth';
import { uploadAvatar } from '../services/storage';
import { User } from '../types/supabase';

// Validation schema
const ProfileSchema = Yup.object().shape({
  full_name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().nullable(),
});

type ProfileFormValues = {
  full_name: string;
  email: string;
  phone: string | null;
};

/**
 * ProfileScreen Component
 * 
 * Allows users to view and edit their profile information.
 */
export const ProfileScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, session } = useAuth();
  const { colors, spacing } = theme;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);
  const [editMode, setEditMode] = useState(false);
  
  // Handle image picking from gallery
  const handleSelectImage = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need camera roll permissions to upload an avatar.');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        
        // Upload the image to storage
        const uri = result.assets[0].uri;
        const fileType = uri.substring(uri.lastIndexOf('.') + 1);
        
        try {
          const avatarUrl = await uploadAvatar(uri, fileType);
          
          if (avatarUrl) {
            // Update the user's avatar URL in the database
            await updateUserProfile({ avatar_url: avatarUrl });
            setAvatar(avatarUrl);
            
            // Notify the user
            Alert.alert('Success', 'Your profile picture has been updated.');
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Upload Error', 'Failed to upload avatar. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'An error occurred while selecting the image.');
      setIsUploading(false);
    }
  };
  
  // Handle form submission
  const handleUpdateProfile = async (values: ProfileFormValues) => {
    try {
      setIsSaving(true);
      
      // Only update if there are changes
      if (
        values.full_name !== user?.full_name ||
        values.phone !== user?.phone
      ) {
        const updatedUser = await updateUserProfile({
          full_name: values.full_name,
          phone: values.phone,
        });
        
        if (updatedUser) {
          Alert.alert('Success', 'Your profile has been updated successfully.');
          setEditMode(false);
        } else {
          Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
      } else {
        // No changes were made
        setEditMode(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Profile
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={toggleEditMode}
          disabled={isSaving}
        >
          <Text style={[styles.editButtonText, { color: colors.primary }]}>
            {editMode ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          {isUploading ? (
            <View style={[styles.avatar, { backgroundColor: colors.background.secondary }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="person" size={50} color={colors.text.secondary} />
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.changeAvatarButton, { backgroundColor: colors.primary }]}
            onPress={handleSelectImage}
            disabled={isUploading}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <Formik
          initialValues={{
            full_name: user?.full_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
          }}
          validationSchema={ProfileSchema}
          onSubmit={handleUpdateProfile}
          enableReinitialize
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <FormInput
                label="Full Name"
                placeholder="Enter your full name"
                leftIcon="person-outline"
                value={values.full_name}
                onChangeText={handleChange('full_name')}
                onBlur={handleBlur('full_name')}
                error={errors.full_name}
                touched={touched.full_name}
                editable={editMode}
              />
              
              <FormInput
                label="Email"
                placeholder="Enter your email"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                touched={touched.email}
                editable={false} // Email cannot be changed directly
              />
              
              <FormInput
                label="Phone Number (Optional)"
                placeholder="Enter your phone number"
                leftIcon="call-outline"
                keyboardType="phone-pad"
                value={values.phone || ''}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                error={errors.phone}
                touched={touched.phone}
                editable={editMode}
              />
              
              {editMode && (
                <Button
                  title="Save Changes"
                  onPress={() => handleSubmit()}
                  isLoading={isSaving}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </View>
          )}
        </Formik>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    marginTop: 16,
  },
});

export default ProfileScreen; 