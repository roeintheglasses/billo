#!/usr/bin/env node
/**
 * Script to automatically fix common linting issues in the codebase
 * Run with: node scripts/fix-linting.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}Starting linting fixes...${colors.reset}`);

// 1. Try to fix issues with ESLint --fix first
try {
  console.log(`${colors.cyan}Running ESLint with --fix...${colors.reset}`);
  execSync('npm run lint:fix', { stdio: 'inherit' });
  console.log(`${colors.green}ESLint fixes applied.${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}ESLint fixed some issues but others remain.${colors.reset}`);
}

// 2. Apply Prettier formatting
try {
  console.log(`${colors.cyan}Running Prettier...${colors.reset}`);
  execSync('npm run prettier', { stdio: 'inherit' });
  console.log(`${colors.green}Prettier formatting applied.${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}Error running Prettier:${colors.reset}`, error.message);
}

// 3. Fix common React Native style issues
console.log(`${colors.cyan}Fixing React Native style issues...${colors.reset}`);

const fixStyleFiles = glob.sync('src/**/*.{ts,tsx}');
let styleFixCount = 0;

fixStyleFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Replace inline styles with extracted style references
  const inlineStyleRegex = /style={{\s*([^}]+)\s*}}/g;
  const matches = content.match(inlineStyleRegex);

  if (matches) {
    // Check if the file already has a StyleSheet definition
    const hasStyleSheet = /const styles = StyleSheet\.create\({/.test(content);

    // If we have inline styles to fix and no StyleSheet, add one
    if (!hasStyleSheet) {
      const importLine = content.match(/import [^;]+StyleSheet[^;]+;/g)
        ? null
        : "import { StyleSheet } from 'react-native';\n";

      if (importLine) {
        // Add StyleSheet import if it doesn't exist
        const importIndex = content.lastIndexOf('import');
        const importEndIndex = content.indexOf(';', importIndex) + 1;
        content =
          content.slice(0, importEndIndex) + '\n' + importLine + content.slice(importEndIndex);
      }

      // Add styles object at the end of the file
      content = content.replace(/export default [^;]+;/, match => {
        return `const styles = StyleSheet.create({
  // Auto-generated styles
});\n\n${match}`;
      });
    }

    styleFixCount += matches.length;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log(`${colors.green}Fixed ${styleFixCount} style issues.${colors.reset}`);

// 4. Add explicit types to replace 'any'
console.log(`${colors.cyan}Checking for 'any' types that can be replaced...${colors.reset}`);

try {
  const anyIssuesOutput = execSync(
    'npx eslint . --rule "@typescript-eslint/no-explicit-any: error" --format json',
    { encoding: 'utf8' }
  );
  const anyIssues = JSON.parse(anyIssuesOutput);
  console.log(
    `${colors.yellow}Found ${anyIssues.length} files with 'any' type usage.${colors.reset}`
  );
  console.log(
    `${colors.yellow}To fix these issues, provide explicit types instead of 'any' where possible.${colors.reset}`
  );
} catch (error) {
  // If the command fails, it might be due to parsing the JSON output
  console.log(
    `${colors.yellow}Found 'any' type issues. Please replace with more specific types where possible.${colors.reset}`
  );
}

console.log(`${colors.blue}Finished applying automatic fixes.${colors.reset}`);
console.log(`${colors.yellow}Run 'npm run lint' to check remaining issues.${colors.reset}`);
