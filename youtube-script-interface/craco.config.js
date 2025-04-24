const path = require('path');
const { whenProd } = require('@craco/craco');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@context': path.resolve(__dirname, 'src/context/'),
      '@assets': path.resolve(__dirname, 'src/assets/'),
      '@utils': path.resolve(__dirname, 'src/utils/')
    },
    plugins: [
      ...whenProd(() => [
        // Compression gzip pour les fichiers statiques
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        }),
      ], []),
    ],
    configure: (webpackConfig) => {
      // Optimisations pour la production
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true, // Supprimer console.log en production
                },
                output: {
                  comments: false, // Supprimer les commentaires
                },
              },
              extractComments: false,
            }),
          ],
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 240000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
              vendors: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: -10
              },
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true,
              },
            },
          },
        };
      }
      return webpackConfig;
    },
  },
};
