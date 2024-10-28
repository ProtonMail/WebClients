import type { Configuration } from "webpack";
import { rules } from "./webpack.rules";
import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

rules.push({
    test: /\.css$/,
    use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

export const rendererConfig: Configuration = {
    module: {
        rules,
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            logger: "webpack-infrastructure",
        }),
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    },
};
