import UAParser from 'ua-parser-js';

import { SUPPORTED_ELECTRON_APP } from '@proton/components/hooks/useIsElectronApp';

import { APPS, APP_NAMES } from '../constants';
import { isMac, isWindows } from './browser';

const uaParser = new UAParser();
const ua = uaParser.getResult();

export const isElectronApp = /electron/i.test(ua.ua);
export const isElectronOnMac = isElectronApp && isMac();
export const isElectronOnWindows = isElectronApp && isWindows();

export const isElectronOnSupportedApps = (app: APP_NAMES) => {
    return isElectronApp && SUPPORTED_ELECTRON_APP.includes(app);
};

export const isElectronOnInboxApps = (app: APP_NAMES) => {
    return isElectronApp && (app === APPS.PROTONCALENDAR || app === APPS.PROTONMAIL || app === APPS.PROTONACCOUNT);
};

/* Electron apps built with Electron Forge will inject the `productName` and
 * `version` properties of the app's package.json in the user-agent. */
export const isElectronMail = isElectronApp && /ProtonMail/i.test(ua.ua);
export const isElectronPass = isElectronApp && /ProtonPass/i.test(ua.ua);

/*
 * The version of the application is injected in the user-agent by Electron Forge.
 * This method works if the version uses the following format: `x.y.z`.
 */
export const electronAppVersion = ua.ua.match(/((ProtonMail|ProtonPass)\/)(?<version>([0-9][.]).{3})/i)?.groups
    ?.version;
