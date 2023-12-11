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
