import UAParser from 'ua-parser-js';

import { SUPPORTED_ELECTRON_APP } from '@proton/components/hooks/useIsElectronApp';

import { APP_NAMES } from '../constants';
import { isMac, isWindows } from './browser';

const uaParser = new UAParser();
const ua = uaParser.getResult();

export const isElectronApp = () => {
    return /electron/i.test(ua.ua);
};

export const isElectronOnMac = () => {
    return isElectronApp() && isMac();
};

export const isElectronOnWindows = () => {
    return isElectronApp() && isWindows();
};

export const isElectronOnSupportedApps = (app: APP_NAMES) => {
    return isElectronApp() && SUPPORTED_ELECTRON_APP.includes(app);
};
