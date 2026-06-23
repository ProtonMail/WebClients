import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { store } from '../store';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'contentProtection:get': IPCChannel<[], boolean>;
        'contentProtection:set': IPCChannel<[enabled: boolean], void>;
    }
}

export const getContentProtection = () => store.get('contentProtection') === true;

export const applyContentProtection = (browserWindow: MaybeNull<BrowserWindow>, enabled = getContentProtection()) => {
    browserWindow?.setContentProtection(Boolean(enabled && !process.env.PASS_DEBUG));
};

export const setContentProtection = (getWindow: () => MaybeNull<BrowserWindow>, enabled: boolean) => {
    const value = enabled === true;
    store.set('contentProtection', value);
    applyContentProtection(getWindow(), value);
};

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('contentProtection:get', getContentProtection);
    setupIpcHandler('contentProtection:set', (enabled) => setContentProtection(getWindow, enabled));
};
