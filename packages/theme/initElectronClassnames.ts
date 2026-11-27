import {
    canGetInboxDesktopInfo,
    getInboxDesktopInfo,
    hasInboxDesktopFeature,
} from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp, isElectronOnMac, isElectronOnWindows } from '@proton/shared/lib/helpers/desktop';

import { ColorScheme, ThemeModeSetting } from './constants';
import type { ThemeSetting } from './themes';
import { electronAppTheme, getDarkThemes } from './themes';

export const updateElectronThemeModeClassnames = (theme: ThemeSetting) => {
    let prefersDark = false;

    if (theme.Mode === ThemeModeSetting.Dark) {
        prefersDark = true;
    } else if (theme.Mode === ThemeModeSetting.Auto) {
        if (canGetInboxDesktopInfo && hasInboxDesktopFeature('FullTheme')) {
            prefersDark = getInboxDesktopInfo('colorScheme') === ColorScheme.Dark;
        } else {
            prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    }

    const selectedTheme = prefersDark ? theme.DarkTheme : theme.LightTheme;
    const isUsingDarkTheme = getDarkThemes().includes(selectedTheme);

    if (isUsingDarkTheme) {
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
