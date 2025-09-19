import { authService } from 'proton-authenticator/lib/auth/service';

import type { StorageKeyResult } from './types';
import { type StorageKeyAdapter, StorageKeyError, StorageKeySource } from './types';

export const createPasswordAdapter = (): StorageKeyAdapter => {
    const storageKeyResultFromPasswordHash = async (): Promise<StorageKeyResult> => {
        const key = authService.getAppPassword();
        if (!key) return { ok: false, error: StorageKeyError.NO_EXIST };
        return { ok: true, key: key };
    };

    const adapter: StorageKeyAdapter = {
        type: StorageKeySource.PASSWORD,
        downgrade: StorageKeySource.KEYRING,

        /** No external datasource for reading or generating
         * the password adapter's underlying key. It's derived
         * from the user's `offlineKD` when app is unlocked */
        read: storageKeyResultFromPasswordHash,
        generate: storageKeyResultFromPasswordHash,
    };

    return adapter;
};
