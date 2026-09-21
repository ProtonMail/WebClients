import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { store } from '../store';
import { isMac, isWindows } from '../utils/platform';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'contentProtection:get': IPCChannel<[], boolean>;
        'contentProtection:set': IPCChannel<[enabled: boolean], void>;
    }
}

const isSupported = () => isMac() || isWindows();

export const getContentProtection = () => isSupported() && store.get('contentProtection') === true;

export const applyContentProtection = (browserWindow: MaybeNull<BrowserWindow>, enabled = getContentProtection()) => {
    if (isSupported()) browserWindow?.setContentProtection(enabled);
};

export const setContentProtection = (getWindow: () => MaybeNull<BrowserWindow>, enabled: boolean) => {
    const value = enabled === true;
    if (value && !isSupported()) throw new Error('Screen privacy is not supported on this platform');
    store.set('contentProtection', value);
    applyContentProtection(getWindow(), value);
};

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('contentProtection:get', getContentProtection);
    setupIpcHandler('contentProtection:set', (enabled) => setContentProtection(getWindow, enabled));
};
