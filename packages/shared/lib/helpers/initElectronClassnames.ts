import { canGetInboxDesktopInfo, getInboxDesktopInfo, hasInboxDesktopFeature } from '../desktop/ipcHelpers';
import { ThemeModeSetting, ThemeSetting, electronAppTheme } from '../themes/themes';
import { isElectronApp, isElectronOnMac, isElectronOnWindows } from './desktop';

export const updateElectronThemeModeClassnames = (theme: ThemeSetting) => {
    const prefersDark =
        theme.Mode === ThemeModeSetting.Dark ||
        (theme.Mode === ThemeModeSetting.Auto && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (prefersDark) {
        document.body.classList.add('is-electron-dark');
        document.body.classList.remove('is-electron-light');
    } else {
        document.body.classList.remove('is-electron-dark');
        document.body.classList.add('is-electron-light');
    }
};

export const initElectronClassnames = () => {
    if (isElectronApp) {
        document.body.classList.add('is-electron');

        if (hasInboxDesktopFeature('ThemeSelection') && canGetInboxDesktopInfo) {
            updateElectronThemeModeClassnames(getInboxDesktopInfo('theme'));
        } else {
            updateElectronThemeModeClassnames(electronAppTheme);
        }
    }

    if (isElectronOnMac) {
        document.body.classList.add('is-electron-mac');
    }

    if (isElectronOnWindows) {
        document.body.classList.add('is-electron-windows');
    }
};
