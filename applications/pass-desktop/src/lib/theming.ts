import { nativeTheme } from 'electron';

import type { DesktopTheme } from '@proton/pass/types';

import { store } from '../store';
import { setupIpcHandler } from './ipc';

export const setTheme = (theme: DesktopTheme) => {
    store.set('theme', theme);
    nativeTheme.themeSource = theme;
};

export const getTheme = () => store.get('theme') ?? 'system';

export const setupIpcHandlers = () => {
    setupIpcHandler('theming:setTheme', (_, theme: DesktopTheme) => setTheme(theme));
    setupIpcHandler('theming:getTheme', getTheme);
};
