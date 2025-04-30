import { nativeTheme } from 'electron';

import type { DesktopTheme } from '@proton/pass/types';

import { store } from '../store';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'theming:setTheme': IPCChannel<[theme: DesktopTheme], void>;
        'theming:getTheme': IPCChannel<[], DesktopTheme>;
    }
}

export const setTheme = (theme: DesktopTheme) => {
    store.set('theme', theme);
    nativeTheme.themeSource = theme;
};

export const getTheme = () => store.get('theme') ?? 'system';

export const setupIpcHandlers = () => {
    setupIpcHandler('theming:setTheme', (_, theme) => setTheme(theme));
    setupIpcHandler('theming:getTheme', getTheme);
};
