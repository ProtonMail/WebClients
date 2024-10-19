import { type BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

export type BiometricsFactory = (getWindow: () => MaybeNull<BrowserWindow>) => BiometricsPlatformHandler;

export type BiometricsPlatformHandler = {
    canCheckPresence: () => Promise<boolean>;
    checkPresence: (e: Electron.IpcMainInvokeEvent, reason?: string) => Promise<boolean>;
    getDecryptionKey: (e: Electron.IpcMainInvokeEvent, challenge: string) => Promise<MaybeNull<string[]>>;
    getSecret: (e: Electron.IpcMainInvokeEvent, key: string, version: number) => Promise<MaybeNull<string>>;
    setSecret: (e: Electron.IpcMainInvokeEvent, key: string, secret: Uint8Array) => Promise<void>;
    deleteSecret: (e: Electron.IpcMainInvokeEvent, key: string) => Promise<void>;
};
