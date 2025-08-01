import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { type ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'path';

import pkg from './package.json';
import getExtraResource from './src/utils/extra-resource';
import mainConfig from './webpack.main.config';
import rendererConfig from './webpack.renderer.config';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        icon: 'assets/logo',
        extraResource: ['assets', ...getExtraResource()],
        appBundleId: 'me.proton.pass.electron',
        executableName: process.platform === 'win32' ? 'ProtonPass' : 'Proton Pass',
        // required for debian, else MakerDeb will incorrectly use name from package.json
        name: 'Proton Pass',
        appCategoryType: 'public.app-category.productivity',
        osxSign: {},
        osxNotarize:
            process.env.CI || process.env.PASS_DESKTOP_NOTARIZE
                ? {
                      appleId: process.env.PASS_DESKTOP_APPLE_ID!,
                      appleIdPassword: process.env.PASS_DESKTOP_APPLE_ID_PASSWORD!,
                      teamId: process.env.PASS_DESKTOP_APPLE_TEAM_ID!,
                  }
                : undefined,
    },
    rebuildConfig: {},
    makers: [
        // Windows
        new MakerSquirrel({
            loadingGif: path.join(__dirname, 'assets', 'installSpinner.gif'),
            iconUrl: path.join(__dirname, 'assets', 'logo.ico'),
            setupIcon: path.join(__dirname, 'assets', 'logo.ico'),
            signWithParams: process.env.SQUIRREL_SIGNTOOL_ARGS,
            setupExe: `ProtonPass_Setup_${pkg.version}.exe`,
            name: 'ProtonPass',
            vendorDirectory: `${__dirname}/../../packages/shared/lib/squirrel/assets`,
        }),
        // macOS
        new MakerDMG((arch) => ({
            appPath: '',
            name: `ProtonPass_${pkg.version}`,
            background: path.join(__dirname, 'assets', 'dmg-background.png'),
            icon: path.join(__dirname, 'assets', 'volume-icon.icns'),
            contents: () => [
                {
                    x: 150,
                    y: 180,
                    type: 'file',
                    path: `${process.cwd()}/out/Proton Pass-darwin-${arch}/Proton Pass.app`,
                },
                { x: 350, y: 180, type: 'link', path: '/Applications' },
            ],
            additionalDMGOptions: {
                window: {
                    size: {
                        width: 500,
                        height: 345,
                    },
                },
            },
        })),
        // ZIP for macOS updates
        new MakerZIP(
            {
                macUpdateManifestBaseUrl: 'https://proton.me/download/PassDesktop/darwin/universal',
            },
            ['darwin']
        ),
        // Linux Debian
        new MakerDeb({
            options: {
                name: 'proton-pass',
                categories: ['Utility'],
                productName: 'Proton Pass',
                bin: 'Proton Pass',
                genericName: 'Password Manager',
                productDescription: 'Open-source and secure identity manager.',
                homepage: 'https://proton.me/pass',
                icon: path.join(__dirname, 'assets', 'logo.svg'),
                maintainer: 'Proton',
            },
        }),
        // Linux Fedora
        new MakerRpm({
            options: {
                name: 'proton-pass',
                categories: ['Utility'],
                productName: 'Proton Pass',
                bin: 'Proton Pass',
                genericName: 'Password Manager',
                productDescription: 'Open-source and secure identity manager.',
                homepage: 'https://proton.me/pass',
                icon: path.join(__dirname, 'assets', 'logo.svg'),
            },
        }),
    ],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
            devServer: {
                client: {
                    overlay: false,
                },
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
            [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
        }),
    ],
};

export default config;
