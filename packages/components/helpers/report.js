import { getOS, getBrowser, getDevice } from 'proton-shared/lib/helpers/browser';

const CLIENTS = {
    Web: 'Angular',
    ProtonMailReact: 'ProtonMail React',
    ProtonContactReact: 'ProtonContact React',
    ProtonMailSettingsReact: 'ProtonMail Settings React',
    ProtonCalendarReact: 'ProtonCalendar React',
    ProtonDriveReact: 'ProtonDrive React',
    ProtonWalletReact: 'ProtonWallet React',
    ProtonVPN: 'ProtonVPN React'
};

export const getClient = (clientID) => CLIENTS[clientID];

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
        DeviceModel: device.model
    };
};
