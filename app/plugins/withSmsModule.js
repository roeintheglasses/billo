const {
  withProjectBuildGradle,
  withAppBuildGradle,
  AndroidConfig,
} = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

/**
 * Add the SMS package to the list of native packages in the app
 * and set up Kotlin support
 */
const withSmsModule = config => {
  // Modify the MainApplication.java
  config = AndroidConfig.Paths.withMainApplication(config, async config => {
    const mainApplicationPath = config.modResults.path;
    const mainApplication = config.modResults.contents;

    // Add import statement
    const importContents = `import com.billo.SmsPackage;`;
    const importMerged = mergeContents({
      tag: 'withSmsModule-imports',
      src: mainApplication,
      newSrc: importContents,
      anchor: `import com.facebook.react.PackageList;`,
      offset: 0, // Insert above the anchor
      comment: '//',
    });
    if (!importMerged.didMerge) {
      console.warn('Failed to add import for SmsPackage to MainApplication.java');
    }

    // Add the package to getPackages()
    const packageListContents = `      // Add the SMS package
      packages.add(new SmsPackage());`;
    const packageListMerged = mergeContents({
      tag: 'withSmsModule-packages',
      src: importMerged.contents,
      newSrc: packageListContents,
      anchor: `return packages;`,
      offset: -1, // Insert before the return
      comment: '//',
    });
    if (!packageListMerged.didMerge) {
      console.warn('Failed to add SmsPackage to MainApplication.java getPackages() method');
    }

    config.modResults.contents = packageListMerged.contents;
    return config;
  });

  // Add Kotlin support to the project build.gradle
  config = withProjectBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      // Add Kotlin version to the ext block
      let contents = config.modResults.contents;
      if (!contents.includes('kotlin_version')) {
        contents = contents.replace(
          /buildscript\s?{/,
          `buildscript {
    ext {
        kotlin_version = '1.8.0'`
        );

        // If there's already an ext block, replace our ext with just the kotlin_version line
        contents = contents.replace(
          /buildscript\s?{\s*ext\s?{\s*kotlin_version = '[^']*'/,
          `buildscript {
    ext {
        kotlin_version = '1.8.0'`
        );

        // If there's already an ext block with other properties, just add kotlin_version
        contents = contents.replace(
          /ext\s?{(?!\s*kotlin_version)/,
          `ext {
        kotlin_version = '1.8.0'`
        );
      }

      // Add the Kotlin plugin to the dependencies
      if (!contents.includes('kotlin-gradle-plugin')) {
        contents = contents.replace(
          /dependencies\s?{/,
          `dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  // Add Kotlin plugin and dependencies to app build.gradle
  config = withAppBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Apply Kotlin plugin
      if (!contents.includes('kotlin-android')) {
        contents = contents.replace(
          /apply plugin: "com.android.application"/,
          `apply plugin: "com.android.application"
apply plugin: "kotlin-android"`
        );
      }

      // Add Kotlin dependencies
      if (!contents.includes('kotlin-stdlib')) {
        contents = contents.replace(
          /dependencies\s?{/,
          `dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version"`
        );
      }

      // Ensure we have the expo-modules-core dependency
      if (!contents.includes('expo-modules-core')) {
        contents = contents.replace(
          /dependencies\s?{/,
          `dependencies {
    implementation project(':expo-modules-core')`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};

module.exports = withSmsModule;
