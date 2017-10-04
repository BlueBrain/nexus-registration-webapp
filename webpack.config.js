const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    config: "./config.js",
    index: ["babel-polyfill", "./src/index.js"],
    edit: ["babel-polyfill", "./src/edit.js"]
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "index",
      chunks: ["common", "index"],
      minChunks: 2
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "edit",
      chunks: ["common", "edit"],
      micChinks: 2
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "config",
      chunks: ["config"],
    }),
    new CopyWebpackPlugin([{
      context: './src',
      from: '*.html',
    }])
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }]
      }
    ]
  }
};
