import TOML from '@iarna/toml';
import fs from 'fs';

import { getWebpackOptions } from '@proton/pack/lib/config';
import type { ProtonPackOptions } from '@proton/pack/lib/interface';

import appConfig from './appConfig';

const apiEnv = process.env.API_ENV || 'proton.me';
const dev = process.env.NODE_ENV !== 'production';

const cargo = fs.readFileSync('./src-tauri/Cargo.toml', { encoding: 'utf-8' });
const version = (TOML.parse(cargo) as any).package.version as string;

const options: Partial<ProtonPackOptions> = {
    version: dev ? `${version}-dev` : version,
    api: `https://authenticator.${apiEnv}/api`,
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
    analyze: false,
    noLogicalScss: false,
    optimizeAssets: true,
};

export const webpackOptions = getWebpackOptions({ protonPackOptions: JSON.stringify(options) }, { appConfig });
