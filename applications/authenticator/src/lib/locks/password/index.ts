import { clearStorageAndReload } from 'proton-authenticator/lib/app/utils';
import { authService } from 'proton-authenticator/lib/auth/service';
import { StorageKey } from 'proton-authenticator/lib/db/db';
import {
    LOCK_MAX_FAILURES,
    LOCK_STATE_KEY,
    getFailedAttemptCount,
    setFailedAttemptCount,
} from 'proton-authenticator/lib/locks/utils';
import { StorageKeySource } from 'proton-authenticator/lib/storage-key/types';
import { c, msgid } from 'ttag';

import type { OfflineConfig } from '@proton/pass/lib/cache/crypto';
import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { getOfflineComponents, verifyOfflinePassword } from './crypto';

const OFFLINE_CONFIG_KEY = 'offline_config';
const OFFLINE_VERIFIER_KEY = 'offline_verifier';

const getOfflineConfig = (): MaybeNull<OfflineConfig> => {
    try {
        const value = localStorage.getItem(OFFLINE_CONFIG_KEY);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const setOfflineConfig = (config: OfflineConfig) => localStorage.setItem(OFFLINE_CONFIG_KEY, JSON.stringify(config));
const getOfflineVerifier = () => localStorage.getItem(OFFLINE_VERIFIER_KEY);
const setOfflineVerifier = (value: string) => localStorage.setItem(OFFLINE_VERIFIER_KEY, value);

enum PasswordError {
    INVALID,
    CORRUPTED,
}

const getPasswordError = (code: PasswordError): string => {
    switch (code) {
        case PasswordError.INVALID:
            const remainingCount = LOCK_MAX_FAILURES - (getFailedAttemptCount() ?? 0);
            return c('authenticator-2025:Warning').ngettext(
                msgid`Wrong password. You have ${remainingCount} attempt left, after that, your data will be erased.`,
                `Wrong password. You have ${remainingCount} attempts left, after that, your data will be erased.`,
                remainingCount
            );
        case PasswordError.CORRUPTED:
            return c('authenticator-2025:Error').t`An unknown error occured. Please contact us to resolve this issue.`;
    }
};

const verifyPasswordLock = async (password: string): Promise<void> => {
    const offlineConfig = getOfflineConfig();
    const offlineVerifier = getOfflineVerifier();

    /** Can only happen if local storage data was deleted by user */
    if (!(offlineConfig && offlineVerifier)) throw new Error(getPasswordError(PasswordError.CORRUPTED));

    try {
        const offlineKD = await verifyOfflinePassword(password, { offlineConfig, offlineVerifier });
        /** Hydrate the `passwordHash` on successful password
         * verification. Required for `StorageKeyService` to
         * derive the storage key when the lock-mode is "password" */
        authService.setAppPassword(offlineKD);
        setFailedAttemptCount(0);
    } catch {
        authService.setAppPassword(undefined);
        const nextCount = (getFailedAttemptCount() ?? 0) + 1;
        setFailedAttemptCount(nextCount);

        if (nextCount >= LOCK_MAX_FAILURES) await clearStorageAndReload();
        else throw new Error(getPasswordError(PasswordError.INVALID));
    }
};

const setupPasswordLock = async (password: string) => {
    const { offlineConfig, offlineVerifier, offlineKD } = await getOfflineComponents(password);
    authService.setAppPassword(offlineKD);

    /** Migrate the storage key to use a password derived
     * storage key once password lock is setup successfully */
    await StorageKey.generate({
        source: StorageKeySource.PASSWORD,
        confirm: () => Promise.resolve(false),
    }).catch(noop);

    setOfflineConfig(offlineConfig);
    setOfflineVerifier(offlineVerifier);
    setFailedAttemptCount(0);
};

const clearPasswordLock = async () => {
    /** Downgrade the storage key: if password lock is removed
     * the password adapter cannot function */
    await StorageKey.generate({
        source: StorageKeySource.KEYRING,
        /** Confirmation is for generation retry purposes.
         * When clearing the password-lock we want to gracefully
         * downgrade the storage key without user action in case
         * we need to downgrade the KEYRING key when generating. */
        confirm: () => Promise.resolve(false),
    }).catch((err) => {
        /** Do not tolerate clearing password lock if we failed
         * downgrading from a password-derived to a keyring storage key.
         * This would create data-loss for non-synced data. */
        if (StorageKey.source === StorageKeySource.PASSWORD) throw err;
    });

    authService.setAppPassword(undefined);
    localStorage.removeItem(OFFLINE_CONFIG_KEY);
    localStorage.removeItem(OFFLINE_VERIFIER_KEY);
    localStorage.removeItem(LOCK_STATE_KEY);
};

export default {
    clear: clearPasswordLock,
    setup: setupPasswordLock,
    verify: verifyPasswordLock,
};
