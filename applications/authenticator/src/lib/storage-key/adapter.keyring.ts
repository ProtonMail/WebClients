import logger from 'proton-authenticator/lib/logger';
import type { KeyringError } from 'proton-authenticator/lib/tauri/commands';
import { commands } from 'proton-authenticator/lib/tauri/commands';

import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import type { StorageKeyAdapter } from './types';
import { StorageKeyError, StorageKeySource } from './types';

const intoStorageKeyAdapterError = (error: KeyringError): StorageKeyError => {
    switch (error.type) {
        case 'NoEntry':
            /** Storage key was removed from keyring. If we have encrypted data in IDB,
             * we are now unable to decrypt it. This likely means the user tampered with
             * his keyring manually and data loss is expected. In such cases, regenerate. */
            return StorageKeyError.NO_EXIST;
        case 'NoStorageAccess':
        case 'PlatformFailure':
            /** This indicates runtime failure in the underlying platform storage system.
             * OR that the underlying secure storage holding saved items could not be accessed.
             * We should notify the user and let him decide how to proceed. */
            return StorageKeyError.PLATFORM;
        case 'Ambiguous':
        case 'BadEncoding':
        case 'Invalid':
        case 'TooLong':
        case 'Unknown':
            return StorageKeyError.CORRUPTED;
    }
};

if (process.env.QA_BUILD) {
    const self = window as any;
    self['qa::keyring::suppress'] = () => localStorage.setItem('qa::keyring::suppressed', '1');
    self['qa::keyring::enable'] = () => localStorage.removeItem('qa::keyring::suppressed');
}

/** QA utility to prevent OS keyring access for testing error flows.
 * Throws error when keyring is suppressed via localStorage flag.
 * Active only in non-prod builds to prevent accidental suppression. */
const assertKeyringAvailable = () => {
    if (process.env.QA_BUILD) {
        const flag = localStorage.getItem('qa::keyring::suppressed');
        if (flag !== null) throw new Error('Keyring adapter suppressed');
    }
};

export const createKeyringAdapter = (): StorageKeyAdapter => {
    const adapter: StorageKeyAdapter = {
        type: StorageKeySource.KEYRING,
        downgrade: StorageKeySource.FALLBACK,

        read: async (ref) => {
            try {
                assertKeyringAvailable();

                /** Backwards compatibility: before 1.1.4 we would use a single
                 * constant storage key identifier in keyring. This could lead
                 * to having duplicate keyring entries causing unpredictable keyring
                 * secret resolution. Support `ref.id` for legacy keys. */
                const result = await commands.getStorageKey(ref.adapterKeyId ?? ref.id);

                if (result.status === 'error') {
                    logger.info(`[adapter::keyring] An error occured while reading secret [${result.error.type}]`);
                    return { ok: false, error: intoStorageKeyAdapterError(result.error) };
                }

                logger.info('[adapter::keyring] Resolved storage secret');
                return { ok: true, key: base64StringToUint8Array(result.data) };
            } catch (err) {
                logger.info(`[adapter::keyring] critical read error ${err}`);
                return { ok: false, error: StorageKeyError.UNKNOWN };
            }
        },

        generate: async (keyId) => {
            try {
                assertKeyringAvailable();
                const result = await commands.generateStorageKey(keyId);

                if (result.status === 'error') {
                    logger.info('[adapter::keyring] Storage key could not be saved to keyring');
                    return { ok: false, error: intoStorageKeyAdapterError(result.error) };
                }

                /** storage key was successfully stored to keyring
                 * store a reference to its source and id in IDB. */
                logger.info('[adapter::keyring] Storage secret saved');
                return { ok: true, key: base64StringToUint8Array(result.data) };
            } catch (err) {
                logger.info(`[adapter::keyring] critical generation error ${err}`);
                return { ok: false, error: StorageKeyError.UNKNOWN };
            }
        },
    };

    return adapter;
};
