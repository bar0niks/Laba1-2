const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { container } = require("webpack");

const { ModuleFederationPlugin } = container;

function createWebpackConfig(options) {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const defaultStateManager = process.env.DEFAULT_STATE_MANAGER || "mobx";
  const isDevelopment = mode === "development";

  return {
    mode,
    entry: options.entry,
    output: {
      path: options.outputPath,
      publicPath: options.publicPath || "auto",
      clean: true
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".jsx"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: {
              configFile: options.tsconfigPath
            }
          }
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        }
      ]
    },
    plugins: [
      new ModuleFederationPlugin({
        name: options.name,
        filename: options.filename || "remoteEntry.js",
        exposes: options.exposes,
        remotes: options.remotes,
        shared: {
          react: { singleton: true, requiredVersion: false },
          "react-dom": { singleton: true, requiredVersion: false },
          "react-router-dom": { singleton: true, requiredVersion: false },
          "@reduxjs/toolkit": { singleton: true, requiredVersion: false },
          "react-redux": { singleton: true, requiredVersion: false },
          mobx: { singleton: true, requiredVersion: false },
          "mobx-react-lite": { singleton: true, requiredVersion: false },
          "@gym/shared-types": { singleton: true, requiredVersion: false },
          "@gym/frontend-common": { singleton: true, requiredVersion: false }
        }
      }),
      new HtmlWebpackPlugin({
        template: options.htmlTemplate,
        title: options.title
      }),
      new webpack.DefinePlugin({
        "process.env.DEFAULT_STATE_MANAGER": JSON.stringify(defaultStateManager),
        "process.env.DASHBOARD_REMOTE_URL": JSON.stringify(
          process.env.DASHBOARD_REMOTE_URL || "http://localhost:8081/remoteEntry.js"
        ),
        "process.env.CLIENTS_REMOTE_URL": JSON.stringify(
          process.env.CLIENTS_REMOTE_URL || "http://localhost:8082/remoteEntry.js"
        )
      })
    ],
    devServer: {
      port: options.port,
      host: "0.0.0.0",
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      static: {
        directory: options.staticDir
      }
    },
    devtool: isDevelopment ? "eval-source-map" : "source-map"
  };
}

module.exports = {
  createWebpackConfig
};
