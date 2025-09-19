const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@components': path.resolve(__dirname, 'components'),
  '@app-components': path.resolve(__dirname, 'src/components'),
  '@constants': path.resolve(__dirname, 'constants'),
  '@hooks': path.resolve(__dirname, 'hooks'),
  '@services': path.resolve(__dirname, 'src/services'),
};

module.exports = config;