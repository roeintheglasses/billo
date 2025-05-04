module.exports = ({ config }) => {
  // Load environment variables
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Default values for development if not provided
  // Note: These are placeholders and should be replaced with actual values
  // in a real environment or .env file
  const defaultSupabaseUrl = 'https://your-supabase-project.supabase.co';
  const defaultSupabaseAnonKey = 'your-anon-key';

  return {
    ...config,
    name: 'Billo',
    slug: 'billo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Use environment variables if available, otherwise use default values
      supabaseUrl: SUPABASE_URL || defaultSupabaseUrl,
      supabaseAnonKey: SUPABASE_ANON_KEY || defaultSupabaseAnonKey,
      eas: {
        projectId: 'your-project-id',
      },
    },
    plugins: [
      // Add Expo plugins here
    ],
  };
};
