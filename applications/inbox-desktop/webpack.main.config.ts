import { DefinePlugin, type Configuration } from "webpack";
import { rules } from "./webpack.rules";

import appConfig from "../mail/appConfig";

const sentryDSN = appConfig.sentryDesktop;

export const mainConfig: Configuration = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: "./src/index.ts",
    // Put your normal webpack config below here
    module: {
        rules: [
            ...rules,
            {
                test: /\.css$/i,
                type: "asset/resource",
            },
        ],
    },
    plugins: [
        new DefinePlugin({
            "process.env.BUILD_TAG": JSON.stringify(process.env.BUILD_TAG),
            "process.env.IDA_TAG": JSON.stringify(process.env.IDA_TAG),
            "process.env.DESKTOP_SENTRY_DSN": JSON.stringify(sentryDSN),
        }),
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    },
};
