import { StorageKey } from 'proton-authenticator/lib/db/db';
import { StorageKeySource } from 'proton-authenticator/lib/storage-key/types';
import { commands } from 'proton-authenticator/lib/tauri/commands';
import { c } from 'ttag';

import type { Maybe } from '@proton/pass/types';
import { isMac, isWindows } from '@proton/shared/lib/helpers/browser';

import { getTranslated as macos } from './macos';
import { getTranslated as windows } from './windows';

const translationProvider = ((): ((code: number) => Maybe<string>) => {
    if (isMac()) return macos;
    if (isWindows()) return windows;
    return () => 'Unknown';
})();

const getBiometricsError = (code: number): string => {
    const message = translationProvider(code);
    return message ?? c('authenticator-2025:Error').t`Biometric authentication failure (Code: ${code})`;
};

const checkBiometricLock = async (): Promise<boolean> => {
    const res = await commands.canCheckPresence();
    if (res.status !== 'ok') throw new Error(getBiometricsError(res.error.code));
    else return res.data;
};

const verifyBiometricLock = async (reason: string) => {
    const res = await commands.checkPresence(reason);
    if (res.status !== 'ok') throw new Error(getBiometricsError(res.error.code));
};

const setupBiometricLock = async () => {
    await verifyBiometricLock(c('authenticator-2025:Reason').t`enable lock`);

    await StorageKey.generate({
        source: StorageKeySource.KEYRING,
        confirm: () => Promise.resolve(false),
    }).catch((err) => {
        /** Do not tolerate setting up Biometric lock if we failed
         * downgrading from a password-derived to a keyring storage key.
         * This would create data-loss for non-synced data. */
        if (StorageKey.source === StorageKeySource.PASSWORD) throw err;
    });
};

export default {
    check: checkBiometricLock,
    setup: setupBiometricLock,
    verify: verifyBiometricLock,
};
