import { ipcMain, nativeTheme } from 'electron';

import type { DesktopTheme } from '@proton/pass/types';

import { store } from '../store';

export const setTheme = (theme: DesktopTheme) => {
    store.set('theme', theme);
    nativeTheme.themeSource = theme;
};

export const getTheme = () => store.get('theme') ?? 'system';

export const setupIpcHandlers = () => {
    ipcMain.handle('theming:setTheme', (_, theme: DesktopTheme) => setTheme(theme));
    ipcMain.handle('theming:getTheme', getTheme);
};
