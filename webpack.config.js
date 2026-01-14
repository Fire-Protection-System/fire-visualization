const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  // Use devtool for fast rebuilds in development
  devtool: 'eval-source-map',
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    port: process.env.FRONTEND_PORT || 8181,
    proxy: [
      {
        context: ['/send-simulation-request'],
        target: process.env.FIRE_SIMULATION_SERVICE || 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        pathRewrite: {'^/send-simulation-request': '/run_simulation'}
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared/'),
      '@features': path.resolve(__dirname, 'src/features/'),
      '@app': path.resolve(__dirname, 'src/app/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.png/,
        type: 'asset/resource',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    // Allow docker-compose provided env vars (env_file) to be used by webpack
    // when no local .env file is present (e.g. in container builds)
    // safe: true prevents overwriting webpack-defined vars like NODE_ENV
    new Dotenv({ systemvars: true, silent: true, safe: true }),
    // Define NODE_ENV consistently for both CommonJS and import.meta.env consumers.
    // We derive it from the environment or fallback to 'development'. Setting the same
    // value for both keys avoids 'Conflicting values' warnings from DefinePlugin.
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.MODE': JSON.stringify(process.env.MODE),
      'process.env.REACT_APP_VERSION': JSON.stringify(process.env.REACT_APP_VERSION),
      'process.env.FIRE_BACKEND_SERVICE': JSON.stringify(process.env.FIRE_BACKEND_SERVICE || ''),
      'process.env.FIRE_SIMULATION_SERVICE': JSON.stringify(process.env.FIRE_SIMULATION_SERVICE || ''),
      'process.env.FIRE_CONFIGURATION_SERVICE': JSON.stringify(process.env.FIRE_CONFIGURATION_SERVICE || ''),
    }),
    // Ensure webpack does not try to load source maps from node_modules
    new webpack.SourceMapDevToolPlugin({
      // keep source maps for our files only, but skip node_modules
      filename: '[file].map',
      exclude: /node_modules/,
      moduleFilenameTemplate: info => {
        // use absolute paths so devtools can resolve sources without using the webpack:// protocol
        return 'webpack:///' + info.absoluteResourcePath.replace(/\\\\/g, '/');
      }
    })
  ],
};
