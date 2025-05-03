# Billo - Subscription Management App

Billo is a comprehensive subscription management application for Android devices that helps users track, manage, and optimize their recurring payments.

## Features

- Automatically detect subscriptions through SMS scanning
- Manually manage subscriptions
- View recurring bills in a calendar interface
- Receive smart notifications for upcoming payments
- Get spend forecasting and insights
- Detect dark patterns in subscription services
- Track shared subscriptions

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase for backend services and authentication
- React Navigation for routing
- React Native Reanimated for animations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/billo.git
   cd billo
   ```

2. Install dependencies
   ```bash
   cd app
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Supabase credentials

4. Start the development server
   ```bash
   npm start
   ```

5. Run on a device or emulator
   ```bash
   npm run android
   # or
   npm run ios
   ```

## Project Structure

The project follows atomic design principles:

- `/app/components/atoms`: Basic building blocks
- `/app/components/molecules`: Compositions of atoms
- `/app/components/organisms`: Compositions of molecules
- `/app/components/templates`: Page layouts
- `/app/screens`: Full pages constructed from templates

## Development

This project uses Task Master for task management. To see available tasks:

```bash
task-master list
```

## Documentation Standards

All technical documentation in this project must follow the standards defined in our [Technical Documentation Rule](.cursor/rules/technical_docs.mdc). Key points include:

- **All external technical documentation MUST be fetched using context7**
- Comprehensive and precise documentation with examples
- Context-rich code comments explaining why, not just what
- Standardized API documentation format
- Detailed documentation for libraries, components, and technologies
- Technology-specific documentation standards for Supabase and React Native/Expo
- Regular documentation updates when implementing changes

Context7 must be used to fetch documentation for any technology used in this project, including React Native, Expo, Supabase, and any other libraries or tools. This ensures our documentation references the most up-to-date and accurate information available.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
