import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import type { ForgeConfig } from "@electron-forge/shared-types";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
    packagerConfig: {
        icon: __dirname + "/assets/icons/icon",
        asar: true,
    },
    rebuildConfig: {},
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                iconUrl: __dirname + "/assets/icons/icon.ico",
                setupIcon: __dirname + "/assets/icons/icon.ico",
                loadingGif: __dirname + "/assets/icons/windows/installSpinner.gif",
            },
        },
        {
            name: "@electron-forge/maker-dmg",
            config: {
                background: __dirname + "/assets/icons/macos/background.png",
                icon: __dirname + "/assets/icons/macos/volume.icns",
                additionalDMGOptions: {
                    window: {
                        size: {
                            width: 658,
                            height: 490,
                        },
                    },
                },
            },
        },
        {
            name: "@electron-forge/maker-zip",
            config: {},
            platforms: ["win32", "win64", "darwin"],
        },
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: "./src/index.html",
                        js: "./src/renderer.ts",
                        name: "main_window",
                        preload: {
                            js: "./src/preload.ts",
                        },
                    },
                ],
            },
        }),
    ],
};

export default config;
