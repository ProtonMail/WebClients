import fs from 'fs';
import path from 'path';

import { getWebpackOptions } from '@proton/pack/lib/configV2';
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

const options: Partial<ProtonPackOptions> = {
    version: dev ? `${JSON.parse(version)}-dev` : JSON.parse(version),
    api: `https://pass.${apiEnv}/api`,
    apiProxy: false,
    sso: `https://account.${apiEnv}`,
    publicPath: '/',
    appMode: 'standalone',
    webpackOnCaffeine: false,
    featureFlags: '',
    sri: true,
    inlineIcons: false,
    warningLogs: false,
    errorLogs: false,
    overlayWarnings: false,
    overlayErrors: false,
    overlayRuntimeErrors: false,
    logical: false,
    analyze: false,
    optimizeAssets: true,
};

export const webpackOptions = getWebpackOptions({ protonPackOptions: JSON.stringify(options) }, { appConfig });
export const getAppVersion = getManifestVersion;
export const MANIFEST_PATH = manifestPath;
