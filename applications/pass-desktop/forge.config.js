const { AutoUnpackNativesPlugin } = require('@electron-forge/plugin-auto-unpack-natives');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { WebpackPlugin } = require('@electron-forge/plugin-webpack');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const mainConfig = require('./webpack.main.config');
const rendererConfig = require('./webpack.renderer.config');
const path = require('path');

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
    packagerConfig: {
        asar: true,
        icon: 'assets/logo',
        extraResource: 'assets',
        appBundleId: 'me.proton.pass.electron',
        executableName: 'ProtonPass',
    },
    rebuildConfig: {},
    makers: [
        // Windows
        new MakerSquirrel({
            loadingGif: path.join(__dirname, 'assets', 'installSpinner.gif'),
            iconUrl: path.join(__dirname, 'assets', 'logo.ico'),
            setupIcon: path.join(__dirname, 'assets', 'logo.ico'),
            signWithParams: process.env.SQUIRREL_SIGNTOOL_ARGS,
            setupExe: `ProtonPass_Setup.exe`,
            name: 'ProtonPass',
        }),
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
            devServer: {
                liveReload: false,
            },
            mainConfig,
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: './src/app/index.ejs',
                        js: './src/app/renderer.tsx',
                        name: 'main_window',
                        preload: {
                            js: './src/preload.ts',
                        },
                    },
                ],
            },
        }),
        new FusesPlugin({
            version: FuseVersion.V1,
            // Disables ELECTRON_RUN_AS_NODE
            [FuseV1Options.RunAsNode]: false,
            // Enables cookie encryption
            [FuseV1Options.EnableCookieEncryption]: true,
            // Disables the NODE_OPTIONS environment variable
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            // Disables the --inspect and --inspect-brk family of CLI options
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            // Enables validation of the app.asar archive on macOS
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            // Enforces that Electron will only load your app from "app.asar" instead of its normal search paths
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};

module.exports = config;
