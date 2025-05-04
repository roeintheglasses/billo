#!/usr/bin/env node
/**
 * Lint CI Script
 * 
 * This script runs linting checks in a CI environment.
 * It generates reports and can optionally fix issues.
 * 
 * Usage:
 *   node scripts/lint-ci.js [--fix] [--report-file=report.json]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const reportFileArg = args.find(arg => arg.startsWith('--report-file='));
const reportFile = reportFileArg 
  ? reportFileArg.split('=')[1] 
  : 'lint-report.json';

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

console.log(`${colors.blue}Running linting checks in CI mode...${colors.reset}`);

// Track results
let errorCount = 0;
let warningCount = 0;
let fixedCount = 0;

try {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, reportFile);
  
  // Run ESLint with JSON reporter
  console.log(`${colors.cyan}Running ESLint...${colors.reset}`);
  const eslintCommand = `npx eslint --format json ${shouldFix ? '--fix' : ''} "src/**/*.{js,jsx,ts,tsx}"`;
  
  try {
    const result = execSync(eslintCommand, { encoding: 'utf8' });
    const eslintReport = JSON.parse(result);
    
    // Count issues
    eslintReport.forEach(file => {
      errorCount += file.errorCount;
      warningCount += file.warningCount;
      fixedCount += file.fixableErrorCount + file.fixableWarningCount;
    });
    
    // Save report
    fs.writeFileSync(reportPath, JSON.stringify(eslintReport, null, 2));
    
    console.log(`${colors.green}ESLint completed: ${errorCount} errors, ${warningCount} warnings${colors.reset}`);
    if (shouldFix) {
      console.log(`${colors.green}Fixed ${fixedCount} issues${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}ESLint failed:${colors.reset}`, error.message);
    // Try to parse the output for the report
    try {
      const eslintReport = JSON.parse(error.stdout);
      fs.writeFileSync(reportPath, JSON.stringify(eslintReport, null, 2));
      
      // Count issues even when there's an error
      eslintReport.forEach(file => {
        errorCount += file.errorCount;
        warningCount += file.warningCount;
      });
      
      console.log(`${colors.yellow}ESLint found issues: ${errorCount} errors, ${warningCount} warnings${colors.reset}`);
    } catch (parseError) {
      console.error(`${colors.red}Failed to parse ESLint output${colors.reset}`);
    }
    
    // Exit with error if we're not fixing
    if (!shouldFix) {
      process.exit(1);
    }
  }
  
  // Run Prettier check if not fixing
  if (!shouldFix) {
    console.log(`${colors.cyan}Checking Prettier formatting...${colors.reset}`);
    try {
      execSync('npx prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}"', { stdio: 'inherit' });
      console.log(`${colors.green}Prettier check passed${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Prettier check failed${colors.reset}`);
      process.exit(1);
    }
  } else {
    // Run Prettier fix
    console.log(`${colors.cyan}Running Prettier formatting...${colors.reset}`);
    try {
      execSync('npx prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"', { stdio: 'inherit' });
      console.log(`${colors.green}Prettier formatting applied${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Prettier formatting failed:${colors.reset}`, error.message);
    }
  }
  
  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    results: {
      errorCount,
      warningCount,
      fixedCount: shouldFix ? fixedCount : 0,
    },
    pass: errorCount === 0,
  };
  
  fs.writeFileSync(
    path.join(reportsDir, 'lint-summary.json'), 
    JSON.stringify(summary, null, 2)
  );
  
  // Final output
  if (errorCount > 0 && !shouldFix) {
    console.log(`${colors.red}Linting failed with ${errorCount} errors and ${warningCount} warnings${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}Linting ${shouldFix ? 'fixes' : 'checks'} completed successfully${colors.reset}`);
  }
  
} catch (error) {
  console.error(`${colors.red}Script error:${colors.reset}`, error);
  process.exit(1);
} 