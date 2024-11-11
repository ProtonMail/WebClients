import { DefinePlugin, type Configuration } from "webpack";
import { rules } from "./webpack.rules";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { resolve } from "node:path";

const AppConfigSchema = z.object({
    appConfig: z.object({
        sentryDesktop: z.string(),
    }),
});

const APP_CONFIG_PATH = resolve(__dirname, "../../packages/config/mail/appConfig.json");
const { appConfig } = AppConfigSchema.parse(JSON.parse(readFileSync(APP_CONFIG_PATH, "utf8")));
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
