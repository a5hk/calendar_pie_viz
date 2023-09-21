var path = require("path");

module.exports = {
  entry: "visualization_source.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    modules: [path.join(__dirname, "src"), "node_modules"],
  },
  output: {
    filename: "visualization.js",
    path: path.resolve(__dirname),
    libraryTarget: "amd",
  },
  externals: ["api/SplunkVisualizationBase", "api/SplunkVisualizationUtils"],
};
