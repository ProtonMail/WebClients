import fs from 'fs';
import path from 'path';

import { getWebpackOptions } from '@proton/pack/lib/config';
import { type ProtonPackOptions } from '@proton/pack/lib/interface';

import appConfig from './appConfig';
import envVars from './tools/env';

const { BUILD_TARGET } = envVars;

const apiEnv = process.env.API_ENV || 'proton.me';
const dev = process.env.NODE_ENV !== 'production';

const SUPPORTED_TARGETS = ['chrome', 'firefox', 'safari'];

if (!SUPPORTED_TARGETS.includes(BUILD_TARGET)) {
    throw new Error(`Build target "${BUILD_TARGET}" is not supported`);
}

const manifest = `manifest-${BUILD_TARGET}.json`;
const manifestPath = path.resolve(__dirname, manifest);
const getManifestVersion = () => JSON.stringify(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).version);
const version = getManifestVersion();

/**
 * - chrome 140 = 1.2% of chrome users
 * - firefox 140 = 2.7% of firefox users
 * - safari 17 = 3.8% of safari users
 * - measured on 19/12/2025
 */
const options: Partial<ProtonPackOptions> = {
    browserslist: (() => {
        switch (BUILD_TARGET) {
            case 'chrome':
                return dev ? 'last 1 chrome version' : 'Chrome 140';
            case 'firefox':
                return dev ? 'last 1 firefox version' : 'Firefox 140';
            case 'safari':
                return dev ? 'last 1 safari version' : 'Safari 17';
            default:
                '';
        }
    })(),
    version: dev ? `${JSON.parse(version)}-dev` : JSON.parse(version),
    api: `https://pass.${apiEnv}/api`,
    apiProxy: false,
    sso: `https://account.${apiEnv}`,
    publicPath: '/',
    appMode: 'standalone',
    featureFlags: '',
    sri: true,
    inlineIcons: false,
    warningLogs: false,
    errorLogs: false,
    overlayWarnings: false,
    overlayErrors: false,
    overlayRuntimeErrors: false,
    noLogicalScss: true,
    analyze: false,
    optimizeAssets: true,
};

export const webpackOptions = getWebpackOptions({ protonPackOptions: JSON.stringify(options) }, { appConfig });
export const getAppVersion = getManifestVersion;
export const MANIFEST_PATH = manifestPath;
