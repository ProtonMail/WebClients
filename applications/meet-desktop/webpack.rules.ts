import { resolve as resolvePath } from "node:path";
import type { ModuleOptions } from "webpack";

export const rules: Required<ModuleOptions>["rules"] = [
    // Add support for native node modules
    {
        // We're specifying native_modules in the test because the asset relocator loader generates a
        // "fake" .node file which is really a cjs file.
        test: /native_modules[/\\].+\.node$/,
        use: "node-loader",
    },
    {
        test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
        parser: { amd: false },
        use: {
            loader: "@vercel/webpack-asset-relocator-loader",
            options: {
                outputAssetBase: "native_modules",
            },
        },
    },
    {
        test: /\.tsx?$/,
        // `@protontech/crypto` ships TypeScript sources via its `exports`, so it must be
        // transpiled by `ts-loader` rather than excluded with the rest of `node_modules`.
        exclude: /(node_modules\/(?!.*(@protontech\/crypto))|\.webpack)/,
        use: {
            loader: "ts-loader",
            options: {
                // An absolute path is required so `ts-loader` keeps using this tsconfig even
                // for TS entrypoints inside `node_modules` (otherwise it resolves a tsconfig
                // relative to each module's entrypoint, e.g. the one in `@protontech/crypto`).
                // See https://github.com/TypeStrong/ts-loader#configfile
                configFile: resolvePath("tsconfig.json"),
                transpileOnly: true,
            },
        },
    },
];
