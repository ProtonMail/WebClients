import { isDesktop, isIpad } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

const OPEN_DESKTOP_APP_STORAGE_KEY = 'open_desktop_app_storage_key';

export const canOpenInDesktopApp = (): boolean => !isElectronApp && isDesktop() && !isIpad();

export const clearDesktopAppPreference = (): void => {
    try {
        localStorage.removeItem(OPEN_DESKTOP_APP_STORAGE_KEY);
    } catch {}
};

export const saveDesktopAppPreference = (): void => {
    try {
        localStorage.setItem(OPEN_DESKTOP_APP_STORAGE_KEY, 'true');
    } catch {}
};

export const getDesktopAppPreference = (): boolean => {
    try {
        const preference = localStorage.getItem(OPEN_DESKTOP_APP_STORAGE_KEY);
        return preference ? Boolean(preference) : false;
    } catch {}
    return false;
};

export const tryOpenInDesktopApp = (meetingUrl: string): void => {
    try {
        const url = new URL(meetingUrl);
        const protocolUrl = `proton-meet://${url.host}${url.pathname}${url.search}${url.hash}`;

        const anchor = document.createElement('a');
        anchor.href = protocolUrl;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();

        setTimeout(() => {
            document.body.removeChild(anchor);
        }, 100);
    } catch {}
};
