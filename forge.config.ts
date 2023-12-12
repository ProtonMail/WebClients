require("dotenv").config();

import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { getExtraResource, getIco, getIcon, getName, isBetaRelease } from "./src/utils/config";

import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

let currentArch = "";
const config: ForgeConfig = {
    hooks: {
        generateAssets: async (_x, _y, arch) => {
            if (arch === "all") {
                currentArch = "universal";
                return;
            }
            currentArch = arch;
        },
    },
    packagerConfig: {
        icon: `${__dirname}/assets/icons/${getIcon()}`,
        asar: true,
        name: getName(),
        extraResource: getExtraResource(),
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
                iconUrl: `${__dirname}/assets/${getIco()}`,
                setupIcon: `${__dirname}/assets/${getIco()}`,
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
                            path: `${process.cwd()}/out/${getName()}-darwin-${currentArch}/${getName()}.app`,
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
    publishers: [
        {
            name: "@electron-forge/publisher-github",
            config: {
                prerelase: isBetaRelease,
                repository: {
                    owner: "flavienbonvin",
                    name: "test-desktop",
                },
            },
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
