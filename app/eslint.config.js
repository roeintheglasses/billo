import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { FlatCompat } from '@eslint/eslintrc';

// Create compat configuration adapter for plugins and configs
const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.extends('plugin:react/recommended'),
  ...compat.extends('plugin:@typescript-eslint/recommended'),

  // Config for all JavaScript and TypeScript files
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-native': reactNativePlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // Start with warning to avoid too many errors at once
      'no-useless-escape': 'warn',
    },
  },

  // Configuration for config files
  {
    files: [
      '**/*.config.js',
      '**/*.config.mjs',
      'babel.config.js',
      'metro.config.js',
      'app.config.js',
      '**/plugins/**/*.js',
    ],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2021,
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off', // Turn off because globals defined above should handle this
    },
  },

  // Special config for test files
  {
    files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.test.{js,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
