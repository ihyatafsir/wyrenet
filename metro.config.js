const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve('/home/absolut7/Documents/26apps/wyresup/node_modules')
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve('/home/absolut7/Documents/26apps/wyresup/node_modules')
    ],
    unstable_enableSymlinks: true
  }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
