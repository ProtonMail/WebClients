import { isElectronApp, isElectronOnMac, isElectronOnWindows } from './desktop';

export const initElectronClassnames = () => {
    if (isElectronApp()) {
        document.body.classList.add('is-electron');
    }

    if (isElectronOnMac()) {
        document.body.classList.add('is-electron-mac');
    }

    if (isElectronOnWindows()) {
        document.body.classList.add('is-electron-windows');
    }
};
