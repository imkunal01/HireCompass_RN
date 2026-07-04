const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add mjs extension for lucide-react-native web bundling compatibility
config.resolver.sourceExts.push('mjs');

module.exports = config;
