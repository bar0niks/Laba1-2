const path = require("path");
const { createWebpackConfig } = require("@gym/webpack-config");

module.exports = createWebpackConfig({
  name: "dashboardMf",
  title: "Dashboard MF",
  entry: path.resolve(__dirname, "src/index.bootstrap.ts"),
  htmlTemplate: path.resolve(__dirname, "public/index.html"),
  outputPath: path.resolve(__dirname, "dist"),
  publicPath: process.env.PUBLIC_PATH || "http://localhost:8081/",
  staticDir: path.resolve(__dirname, "public"),
  tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
  port: 8081,
  exposes: {
    "./DashboardApp": path.resolve(__dirname, "src/index.ts")
  }
});
