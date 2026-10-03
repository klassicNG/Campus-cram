const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// --- BUG FIX FOR MOTI / TSLIB IN EXPO ---
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib' || moduleName.endsWith('/tslib')) {
    return {
      filePath: path.resolve(__dirname, './node_modules/tslib/tslib.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
// ----------------------------------------

// Note: ensure './src/global.css' matches the path Antigravity actually created for you.
module.exports = withNativeWind(config, { input: "./src/global.css" });