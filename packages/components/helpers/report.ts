import { getOS, getBrowser, getDevice } from '@proton/shared/lib/helpers/browser';
import { CLIENT_ID_KEYS, CLIENT_IDS } from '@proton/shared/lib/constants';

export const getClient = (clientID: CLIENT_ID_KEYS) => {
    return CLIENT_IDS[clientID];
};

const getIsTouchDevice = () => navigator.maxTouchPoints > 1;

// Override the reported OS name. On iOS in the Safari Settings there is a setting called "Request Desktop Website".
// When this is enabled the user agent meta-data is altered by Safari mimicking a Desktop device so that it will
// trick servers into sending the desktop version by setting the user agent's OS to MacOS.
const getArtificialOSName = (osName: string) => {
    if (!getIsTouchDevice()) {
        return;
    }
    if (osName === 'Mac OS') {
        return 'iOS';
    }
    if (osName === 'Linux') {
        return 'Android';
    }
};

const getEnhancedOSInfo = () => {
    const os = getOS();

    const artificialOSName = getArtificialOSName(os.name);
    if (artificialOSName) {
        return {
            name: artificialOSName,
            version: '',
            artificial: true,
        };
    }

    return {
        ...os,
        artificial: false,
    };
};

export const getReportInfo = () => {
    const browser = getBrowser();
    const device = getDevice();
    const os = getEnhancedOSInfo();

    return {
        OS: os.name,
        OSVersion: os.version || '',
        OSArtificial: os.artificial,
        Browser: browser.name,
        BrowserVersion: browser.version,
        Resolution: `${window.innerHeight} x ${window.innerWidth}`,
        DeviceName: device.vendor,
        DeviceModel: device.model,
    };
};
