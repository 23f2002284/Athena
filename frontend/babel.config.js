module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          root: ['.'],
          alias: {
            '@components': './components',
            '@components/*': './components/*',
            '@constants': './constants',
            '@hooks': './hooks',
            '@services': './src/services',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
