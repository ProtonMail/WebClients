import { isDesktop, isIpad } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

export const canOpenInDesktopApp = (): boolean => !isElectronApp && isDesktop() && !isIpad();

export const clearDesktopAppPreference = (storageKey: string): void => {
    try {
        localStorage.removeItem(storageKey);
    } catch {}
};

export const saveDesktopAppPreference = (storageKey: string): void => {
    try {
        localStorage.setItem(storageKey, 'true');
    } catch {}
};

export const getDesktopAppPreference = (storageKey: string): boolean => {
    try {
        const preference = localStorage.getItem(storageKey);
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
