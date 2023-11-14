import UAParser from 'ua-parser-js';

import { isMac } from './browser';

const uaParser = new UAParser();
const ua = uaParser.getResult();

export const isElectronApp = () => {
    return /electron/i.test(ua.ua);
};

export const isElectronOnMac = () => {
    return isElectronApp() && isMac();
};
