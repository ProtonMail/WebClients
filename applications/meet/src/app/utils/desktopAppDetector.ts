import { isDesktop, isFirefox, isIpad, isSafari } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

export type DesktopAppOption = 'unavailable' | 'appButton' | 'openOnLoad';

export const canOpenInDesktopApp = (): boolean => !isElectronApp && isDesktop() && !isIpad();

export const getDesktopAppOption = (isOpenDesktopAppOnLoadEnabled: boolean): DesktopAppOption => {
    if (!canOpenInDesktopApp()) {
        return 'unavailable';
    }
    if (isOpenDesktopAppOnLoadEnabled && !isSafari() && !isFirefox()) {
        return 'openOnLoad';
    }
    return 'appButton';
};

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
        return localStorage.getItem(storageKey) === 'true';
    } catch {}
    return false;
};

export const saveBrowserPreference = (storageKey: string): void => {
    try {
        localStorage.setItem(storageKey, 'false');
    } catch {}
};

export const getBrowserPreference = (storageKey: string): boolean => {
    try {
        return localStorage.getItem(storageKey) === 'false';
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
