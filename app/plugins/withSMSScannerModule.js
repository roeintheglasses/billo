const { AndroidConfig } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

/**
 * Add the SMS Scanner package to the list of native packages in the app
 */
const withSMSScannerModule = config => {
  // Modify the MainApplication.java
  config = AndroidConfig.Paths.withMainApplication(config, async config => {
    const mainApplication = config.modResults.contents;

    // Add import statement
    const importContents = `import com.billo.SMSScannerPackage;`;
    const importMerged = mergeContents({
      tag: 'withSMSScannerModule-imports',
      src: mainApplication,
      newSrc: importContents,
      anchor: `import com.facebook.react.PackageList;`,
      offset: 0, // Insert above the anchor
      comment: '//',
    });
    if (!importMerged.didMerge) {
      console.warn('Failed to add import for SMSScannerPackage to MainApplication.java');
    }

    // Add the package to getPackages()
    const packageListContents = `      // Add the SMS Scanner package
      packages.add(new SMSScannerPackage());`;
    const packageListMerged = mergeContents({
      tag: 'withSMSScannerModule-packages',
      src: importMerged.contents,
      newSrc: packageListContents,
      anchor: `return packages;`,
      offset: -1, // Insert before the return
      comment: '//',
    });
    if (!packageListMerged.didMerge) {
      console.warn('Failed to add SMSScannerPackage to MainApplication.java getPackages() method');
    }

    config.modResults.contents = packageListMerged.contents;
    return config;
  });

  return config;
};

module.exports = withSMSScannerModule;
