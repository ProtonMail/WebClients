import { c } from 'ttag';

import type { APP_NAMES} from '@proton/shared/lib/constants';
import { APPS_CONFIGURATION, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getAllAppVersions } from '@proton/shared/lib/desktop/version';
import { getBrowser, getDevice, getOS } from '@proton/shared/lib/helpers/browser';
import { electronAppVersion, isElectronApp, isElectronMail } from '@proton/shared/lib/helpers/desktop';

export const getClientName = (appName: APP_NAMES) => {
    return `Web ${APPS_CONFIGURATION[appName].bareName}`;
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

    const extendedElectronVersion: string = isElectronMail
        ? getAllAppVersions()
        : (electronAppVersion ?? browser.version ?? '');

    const Browser =
        browser.name?.toLowerCase() === 'electron'
            ? c('Browser').t`${MAIL_APP_NAME} Desktop application`
            : browser.name;

    return {
        OS: os.name,
        OSVersion: os.version || '',
        OSArtificial: os.artificial,
        Browser,
        BrowserVersion: isElectronApp ? extendedElectronVersion : browser.version,
        Resolution: `${window.innerHeight} x ${window.innerWidth}`,
        DeviceName: device.vendor,
        DeviceModel: device.model,
    };
};
