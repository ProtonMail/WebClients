import { getWebpackOptions } from '@proton/pack/lib/config';
import type { ProtonPackOptions } from '@proton/pack/lib/interface';

import appConfig from './appConfig';
import pkg from './package.json';

const apiEnv = process.env.API_ENV || 'proton.me';
const dev = process.env.NODE_ENV !== 'production';

const options: Partial<ProtonPackOptions> = {
    version: dev ? `${pkg.version}-dev` : pkg.version,
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
