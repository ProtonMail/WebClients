require("dotenv").config();

import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { type } from "os";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const iconIco = process.env.RELEASE === "beta" ? "icon-beta.ico" : "icon.ico" ?? "icon.ico";
const icon = process.env.RELEASE === "beta" ? "icon-beta" : "icon" ?? "icon";
const name = process.env.RELEASE === "beta" ? "Proton Mail Beta" : "Proton Mail" ?? "Proton Mail";

const config: ForgeConfig = {
    packagerConfig: {
        icon: `${__dirname}/assets/icons/${icon}`,
        asar: true,
        name,
        extraResource: type() === "Darwin" ? ["./src/macos/Uninstall Proton Mail.app", "./src/macos/uninstall.sh"] : [],
        osxSign: {},
        osxNotarize: {
            appleId: process.env.APPLE_ID!,
            appleIdPassword: process.env.APPLE_PASSWORD!,
            teamId: process.env.APPLE_TEAM_ID!,
        },
    },
    rebuildConfig: {},
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                iconUrl: `${__dirname}/assets/${iconIco}`,
                setupIcon: `${__dirname}/assets/${iconIco}`,
                loadingGif: `${__dirname}/assets/windows/install-spinner.gif`,
            },
        },
        {
            name: "@electron-forge/maker-dmg",
            config: {
                background: `${__dirname}/assets/macos/background.png`,
                icon: `${__dirname}/assets/macos/volume.icns`,
                contents: () => {
                    return [
                        {
                            x: 229,
                            y: 250,
                            type: "file",
                            path: `${process.cwd()}/out/${name}-darwin-universal/${name}.app`,
                        },
                        { x: 429, y: 250, type: "link", path: "/Applications" },
                    ];
                },
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
