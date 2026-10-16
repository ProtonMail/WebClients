import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import type { MakerMSIXConfig } from '@electron-forge/maker-msix';
import { MakerMSIX } from '@electron-forge/maker-msix';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { readFileSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'path';

import type { Maybe } from '@proton/pass/types';

import pkg from './package.json';
import getExtraResource from './src/utils/extra-resource';
import mainConfig from './webpack.main.config';
import rendererConfig from './webpack.renderer.config';

type Hash = NonNullable<NonNullable<MakerMSIXConfig['windowsSignOptions']>['hashes']>[number];
type PackagerHook = NonNullable<NonNullable<ForgeConfig['packagerConfig']>['afterCopyExtraResources']>[number];

// macos sign options
const osxNotarize =
    (process.env.CI || process.env.PASS_DESKTOP_NOTARIZE) && !process.env.SKIP_NOTARIZE
        ? {
              appleId: process.env.PASS_DESKTOP_APPLE_ID!,
              appleIdPassword: process.env.PASS_DESKTOP_APPLE_ID_PASSWORD!,
              teamId: process.env.PASS_DESKTOP_APPLE_TEAM_ID!,
          }
        : undefined;

// windows sign options
const windowsSignOptions =
    process.env.CI || process.env.WINDOWS_SIGN_TIMESTAMP_SERVER
        ? {
              hashes: [process.env.WINDOWS_SIGN_HASHES as Hash],
              timestampServer: process.env.WINDOWS_SIGN_TIMESTAMP_SERVER,
              automaticallySelectCertificate: true,
          }
        : undefined;
const windowsPublisher = process.env.WINDOWS_SIGN_PUBLISHER ?? 'CN=Proton AG';

// MSIX requires a 4-part numeric version (Major.Minor.Build.Revision).
const toWindowsVersion = (semver: string): string =>
    /^\d+\.\d+\.\d+\.\d+$/.test(semver) ? semver : `${semver.replace(/[-+].*/, '')}.0`;

const buildAppxManifest = (): Maybe<string> => {
    if (process.platform !== 'win32') return undefined;
    const template = readFileSync(path.join(__dirname, 'AppxManifest.xml.in'), 'utf-8');
    const resolved = template
        .replace(/{{Version}}/g, toWindowsVersion(pkg.version))
        .replace(/{{Publisher}}/g, windowsPublisher);
    const outPath = path.join(os.tmpdir(), `proton-pass-AppxManifest-${process.pid}.xml`);
    writeFileSync(outPath, resolved);
    return outPath;
};

// macOS names and badges the Touch ID and keychain prompts after the bundle whose main executable
// triggers them, so the native messaging host gets its own app bundle to show "Proton Pass" and its
// icon. Runs before signing: osx-sign signs the nested bundle like Electron's helper apps.
const wrapMacHostInBundle = async (stagingPath: string) => {
    // nosemgrep: path-join-resolve-traversal -- packager staging directory, not user input
    const inContents = (...segments: string[]) => path.join(stagingPath, 'Proton Pass.app', 'Contents', ...segments);
    const assets = ['Resources', 'assets'];
    const bundle = ['Helpers', 'proton_pass_nm_host.app', 'Contents'];
    await fs.mkdir(inContents(...bundle, 'MacOS'), { recursive: true });
    await fs.mkdir(inContents(...bundle, 'Resources'), { recursive: true });
    await fs.rename(
        inContents(...assets, 'proton_pass_nm_host'),
        inContents(...bundle, 'MacOS', 'proton_pass_nm_host')
    );
    await fs.copyFile(path.join(__dirname, 'native', 'host', 'Info.plist'), inContents(...bundle, 'Info.plist'));
    await fs.copyFile(inContents(...assets, 'logo.icns'), inContents(...bundle, 'Resources', 'logo.icns'));
};

const bundleMacHost: PackagerHook = (stagingPath, _electronVersion, platform, _arch, done) => {
    if (platform !== 'darwin') return done();
    wrapMacHostInBundle(stagingPath).then(() => done(), done);
};

const config: ForgeConfig = {
    outDir: process.env.OUTPUT_PATH,
    packagerConfig: {
        asar: true,
        icon: 'assets/logo',
        extraResource: ['assets', ...getExtraResource()],
        afterCopyExtraResources: [bundleMacHost],
        appBundleId: 'me.proton.pass.electron',
        executableName: process.platform === 'win32' ? 'ProtonPass' : 'Proton Pass',
        // required for debian, else MakerDeb will incorrectly use name from package.json
        name: 'Proton Pass',
        appCategoryType: 'public.app-category.productivity',
        osxSign: process.env.CI ? {} : undefined,
        osxNotarize,
        // @electron/universal refuses identical Mach-O files across the x64/arm64 slices unless whitelisted.
        // The native messaging host is compiled once for both arches, and the webpack plugin maps the same
        // node_modules `.node` files into both bundles (the universal variant is preferred at runtime anyway).
        osxUniversal: {
            x64ArchFiles:
                '{Contents/Helpers/proton_pass_nm_host.app/Contents/MacOS/proton_pass_nm_host,Contents/Resources/app.asar.unpacked/.webpack/main/native_modules/*.node}',
        },
        // Protocol handler for external login flow
        protocols: [
            {
                name: 'Proton Pass Login',
                schemes: ['protonpass'],
            },
        ],
    },
    rebuildConfig: {},
    makers: [
        // Windows
        new MakerMSIX({
            packageName: `ProtonPass_Setup_${pkg.version}.msix`,
            packageAssets: `${__dirname}/assets`,
            // Use a custom manifest rather than `manifestVariables` because we
            // need Extension blocks the built-in template doesn't expose:
            // windows.protocol for `protonpass://` external-login deep links,
            // and windows.appExecutionAlias to expose the native-messaging
            // host as a launchable alias.
            appManifest: buildAppxManifest(),
            // When appManifest is set, electron-windows-msix derives the
            // build-time Windows Kit version from the manifest's MinVersion
            // (10.0.18362.0 = Windows 10 1903, our runtime floor). That SDK
            // isn't on the CI runner, which only has 10.0.26100.0 installed.
            // Pin explicitly so the runtime floor stays decoupled from the
            // SDK used to package the MSIX.
            windowsKitVersion: '10.0.26100.0',
            sign: !!windowsSignOptions,
            windowsSignOptions,
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
                mimeType: ['x-scheme-handler/protonpass'],
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
                mimeType: ['x-scheme-handler/protonpass'],
            },
        }),
    ],
    hooks: {
        postMake: async (_, makeResults) => {
            for (const result of makeResults) {
                result.artifacts = await Promise.all(
                    result.artifacts.map(async (artifact) => {
                        if (!artifact.endsWith('.msix')) return artifact;
                        const renamed = path.join(
                            path.dirname(artifact),
                            `ProtonPass_${result.packageJSON.version}.msix`
                        );
                        await fs.rename(artifact, renamed);
                        return renamed;
                    })
                );
            }
            return makeResults;
        },
    },
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
            // Enabling only on CI when the app is signed
            // Unless we can't decrypt cookies between two execution of the app
            [FuseV1Options.EnableCookieEncryption]: !!process.env.CI,
            // Disables the NODE_OPTIONS environment variable
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            // Disables the --inspect and --inspect-brk family of CLI options
            // Kept for e2e builds: Playwright drives Electron through them
            [FuseV1Options.EnableNodeCliInspectArguments]: process.env.E2E_TESTS === 'true',
            // Enables validation of the app.asar archive on macOS
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            // Enforces that Electron will only load your app from "app.asar" instead of its normal search paths
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
            [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
        }),
    ],
};

export default config;
