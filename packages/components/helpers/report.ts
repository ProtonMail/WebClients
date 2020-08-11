import { getOS, getBrowser, getDevice } from 'proton-shared/lib/helpers/browser';
import { CLIENT_ID_KEYS, CLIENT_IDS } from 'proton-shared/lib/constants';

export const getClient = (clientID: CLIENT_ID_KEYS) => {
    return CLIENT_IDS[clientID];
};

export const collectInfo = () => {
    const os = getOS();
    const browser = getBrowser();
    const device = getDevice();

    return {
        OS: os.name,
        OSVersion: os.version || '',
        Browser: browser.name,
        BrowserVersion: browser.version,
        Resolution: `${window.innerHeight} x ${window.innerWidth}`,
        DeviceName: device.vendor,
        DeviceModel: device.model,
    };
};
