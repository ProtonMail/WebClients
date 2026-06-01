import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

export type BiometricsFactory = (getWindow: () => MaybeNull<BrowserWindow>) => BiometricsPlatformHandler;

export type BiometricsPlatformHandler = {
    canCheckPresence: () => Promise<boolean>;
    checkPresence: (reason?: string) => Promise<void>;
    getSecret: (key: string, version: number) => Promise<MaybeNull<string>>;
    setSecret: (key: string, secret: Uint8Array<ArrayBuffer>) => Promise<void>;
    deleteSecret: (key: string) => Promise<void>;
};
