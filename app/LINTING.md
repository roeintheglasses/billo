# Linting & Code Quality Guide

This document outlines the linting and code quality tools set up in this project, how to use them, and how to fix common issues.

## Available Linters

The project uses the following linting tools:

- **ESLint**: For JavaScript and TypeScript linting (including React and React Native specific rules)
- **Prettier**: For code formatting
- **Husky & lint-staged**: For pre-commit hooks to ensure code quality before committing

## Configuration Files

- `eslint.config.js`: ESLint configuration using the new flat config format (ESLint v9)
- `.prettierrc`: Prettier formatting rules
- `package.json`: Contains lint-staged and husky configuration

## Linting Commands

The following npm scripts are available for linting:

```bash
# Run ESLint to check for issues
npm run lint

# Run ESLint with --fix to automatically fix issues where possible
npm run lint:fix

# Run Prettier to format all code
npm run prettier

# Run the comprehensive fix script to address multiple issues at once
npm run lint:fix-all
```

## Pre-commit Hooks

The project uses Husky to run linting checks before commits are finalized. When you attempt to commit code, the following will happen automatically:

1. ESLint will run on staged files and attempt to fix issues
2. Prettier will format the staged files
3. If there are critical issues that cannot be fixed automatically, the commit will be rejected

## Fix-Linting Script

The project includes a custom script (`scripts/fix-linting.js`) that can fix multiple categories of issues at once:

1. Run ESLint with --fix to correct auto-fixable issues
2. Apply Prettier formatting to all files
3. Fix common React Native style issues (like inline styles)
4. Identify 'any' types that should be replaced with explicit types

Run it with:

```bash
npm run lint:fix-all
```

## Common Issues and How to Fix Them

### TypeScript 'any' Types

**Issue**: Using `any` type in TypeScript code decreases type safety.

**Fix**: Replace with specific types:

```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
interface UserData {
  id: string;
  name: string;
  email: string;
}
const data: UserData = fetchData();
```

### React Native Style Issues

#### Inline Styles

**Issue**: Inline styles in React Native components reduce performance and readability.

**Fix**: Use StyleSheet:

```tsx
// ❌ Bad
<View style={{ padding: 10, margin: 5 }}>...</View>

// ✅ Good
<View style={styles.container}>...</View>

const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 5
  }
});
```

#### Color Literals

**Issue**: Hardcoded color values make theme management difficult.

**Fix**: Use theme colors:

```tsx
// ❌ Bad
<Text style={{ color: '#333333' }}>Text</Text>

// ✅ Good
import { useTheme } from '../contexts/ThemeContext';

const { colors } = useTheme();
<Text style={{ color: colors.text.primary }}>Text</Text>
```

### Unused Variables and Imports

**Issue**: Unused variables and imports clutter code and may impact bundle size.

**Fix**: Remove them or prefix with underscore:

```typescript
// ❌ Bad
import { useState, useEffect } from 'react';
// ...but only useState is used

// ✅ Good
import { useState } from 'react';
// Or for parameters that are unused but required:
function Component({ requiredProp, _unusedProp }) {
  // ...
}
```

## IDE Integration

### VS Code

1. Install the ESLint and Prettier extensions
2. Configure VS Code to format on save:

```json
// settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Customizing Rules

To modify linting rules:

1. Edit `eslint.config.js` to change ESLint rules
2. Edit `.prettierrc` to change formatting rules
3. Edit the `lint-staged` section in `package.json` to change pre-commit behavior

When adding new rules, consider:
- Does it improve code quality?
- Is it auto-fixable or will it block developers frequently?
- Is there consensus on the team about this rule? 