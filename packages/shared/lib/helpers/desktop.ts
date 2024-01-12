import UAParser from 'ua-parser-js';

import { SUPPORTED_ELECTRON_APP } from '@proton/components/hooks/useIsElectronApp';

import { APP_NAMES } from '../constants';
import { getBrowser, getOS, isMac, isWindows } from './browser';

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

export const getTypeformDesktopUrl = (appVersion: string, appName: APP_NAMES) => {
    const browser = getBrowser();
    const os = getOS();
    // const clientID = getClientID(appName);
    return `https://form.typeform.com/to/XNqstRfx#electron_version=${browser.version}=&os=${os.name}&app_version=${appName}@${appVersion}`;
};

/* Electron apps built with Electron Forge will inject the `productName` and
 * `version` properties of the app's package.json in the user-agent. */
export const isElectronMail = () => isElectronApp() && /ProtonMail/i.test(ua.ua);
export const isElectronPass = () => isElectronApp() && /ProtonPass/i.test(ua.ua);

/*
 * The version of the application is injected in the user-agent by Electron Forge.
 * This method works if the version uses the following format: `x.y.z`.
 */
export const getElectronAppVersion = () => {
    const value = ua.ua.match(/((ProtonMail|ProtonPass)\/)(?<version>([0-9][.]).{3})/i);
    return value?.groups?.version;
};
