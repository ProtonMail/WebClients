/* eslint-disable no-console */
const path = require('path');
const fs = require('fs-extra');

const BUILD_NUMBER = process.env.BUILD_NUMBER || '1';
const AUTOFILL_APPEX_PATH = path.join(
    __dirname,
    'macOS/build/Proton Pass Extensions.app/Contents/PlugIns/AutoFill.appex'
);

module.exports = {
    appId: 'me.proton.pass.electron',
    buildVersion: BUILD_NUMBER,
    files: [
        '.webpack/**/*',
        'package.json',
        '!node_modules/**/*', // Exclude node_modules because webpack bundle has everything
        '!.webpack/**/target/**/*', // Exclude Rust build artifacts
        '!.webpack/**/*.map', // Exclude source maps (optional, add back if need for debugging)
    ],
    mac: {
        target: {
            target: 'mas',
            arch: 'universal',
        },
        x64ArchFiles: 'Contents/PlugIns/AutoFill.appex/**/*',
        type: 'distribution',
        hardenedRuntime: false,
        category: 'public.app-category.utilities',
        identity: 'Proton AG (2SB5Z68H26)',
        icon: 'assets/logo.icns',
        asarUnpack: ['**/*.node'],
        extendInfo: {
            ITSEncryptionExportComplianceCode: 'b4d3bec3-97a5-4995-91d5-b6be046c1144',
            ITSAppUsesNonExemptEncryption: true,
        },
    },
    mas: {
        entitlements: 'mas/entitlements.mas.plist',
        entitlementsInherit: 'mas/entitlements.mas.inherit.plist',
        provisioningProfile: 'mas/MacAppStore.provisionprofile',
    },
    beforePack: async () => {
        // Verify build numbers match between host app and AutoFill extension early
        const appexInfoPlist = path.join(AUTOFILL_APPEX_PATH, 'Contents', 'Info.plist');
        const plistContent = await fs.readFile(appexInfoPlist, 'utf8');
        const buildNumberMatch = plistContent.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/);
        const appexBuildNumber = buildNumberMatch ? buildNumberMatch[1] : null;

        if (appexBuildNumber !== BUILD_NUMBER) {
            throw new Error(
                `Build number mismatch: AutoFill.appex has build number ${appexBuildNumber}, ` +
                    `but host app expects ${BUILD_NUMBER}. ` +
                    `Please rebuild the AutoFill extension with the correct build number.`
            );
        }
    },
    afterSign: async (context) => {
        const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
        const plugInsDir = path.join(appPath, 'Contents', 'PlugIns');
        const appexDest = path.join(plugInsDir, 'AutoFill.appex');

        console.log(`Copying pre-signed AutoFill.appex from ${AUTOFILL_APPEX_PATH} to ${appexDest}`);

        await fs.ensureDir(plugInsDir);
        await fs.copy(AUTOFILL_APPEX_PATH, appexDest, { overwrite: true });

        console.log('AutoFill.appex copied successfully');
    },
};
