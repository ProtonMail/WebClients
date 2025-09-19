import logger from 'proton-authenticator/lib/logger';

import { generateKey } from '@proton/crypto/lib/subtle/aesGcm';

import type { StorageKeyAdapter } from './types';
import { StorageKeyError, StorageKeySource } from './types';

export const createFallbackAdapter = () => {
    const adapter: StorageKeyAdapter = {
        type: StorageKeySource.FALLBACK,
        upgrade: StorageKeySource.KEYRING,

        /** Asserts that the key reference holds the unsafe_key key data */
        read: async (ref) => {
            if (ref.unsafe_key === undefined) return { ok: false, retryable: false, error: StorageKeyError.CORRUPTED };
            return { ok: true, key: ref.unsafe_key };
        },

        generate: async () => {
            logger.info('[adapter::fallback] generating fallback key');
            return { ok: true, key: generateKey() };
        },
    };

    return adapter;
};
