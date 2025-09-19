import logger from 'proton-authenticator/lib/logger';

import { deriveKey } from '@proton/crypto/lib/subtle/aesGcm';
import { type PubSub, createPubSub } from '@proton/pass/utils/pubsub/factory';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { STORAGE_KEY_HKDF_INFO, STORAGE_KEY_IDB_ID, STORAGE_KEY_SALT_LENGTH } from './constants';
import type { StorageKeyAdapter, StorageKeyRef, StorageKeyResult } from './types';
import { StorageKeyError, StorageKeySource } from './types';
import { formatGenerateError, formatReadError, formatResetKeyWarning, formatUnsafeStorageKeyWarning } from './utils';

if (module.hot) module.hot.decline();

export type WithOnRetry<T> = T & {
    confirm: (options: {
        message: string;
        cancelable: boolean;
        operation: 'read' | 'generate';
        warning?: string;
    }) => Promise<boolean>;
};

export type StorageKeyEvents = { type: 'storage_key'; source?: StorageKeySource };
export type StorageKeySaveRefOptions = { rotated: boolean; onSaved: () => void };

export type StorageKeyConfig = {
    onStorageKey: (ref: StorageKeyRef, options: StorageKeySaveRefOptions) => Promise<void>;
    default: StorageKeySource;
    adapters: Record<StorageKeySource, StorageKeyAdapter>;
};

export type StorageKeyState = { storageKey?: CryptoKey; source?: StorageKeySource };
export type StorageKeyInitOptions = WithOnRetry<{ keyRef?: StorageKeyRef; default?: StorageKeySource }>;
export type StorageKeyGenerateOptions = WithOnRetry<{ source?: StorageKeySource }>;

export const generateStorageKeySalt = () => crypto.getRandomValues(new Uint8Array(STORAGE_KEY_SALT_LENGTH));
export const validateStorageKeySalt = (salt: Uint8Array<ArrayBuffer>) =>
    salt && salt.length === STORAGE_KEY_SALT_LENGTH;

export const deriveStorageKey = async (
    raw: Uint8Array<ArrayBuffer>,
    salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> => deriveKey(raw, salt, STORAGE_KEY_HKDF_INFO, { extractable: false });

if (process.env.QA_BUILD) {
    const self = window as any;
    self['qa::storage-key::legacy::enable'] = () => localStorage.setItem('qa::storage-key::legacy', '1');
    self['qa::storage-key::legacy::suppress'] = () => localStorage.removeItem('qa::storage-key::legacy');
}

const checkLegacyMode = process.env.QA_BUILD
    ? () => localStorage.getItem('qa::storage-key::legacy') !== null
    : () => false;

export const createStorageKeyService = (config: StorageKeyConfig) => {
    const state: StorageKeyState = {};
    const pubsub: PubSub<StorageKeyEvents> = createPubSub();
    const { adapters } = config;

    const setState = (next: StorageKeyState) => {
        state.storageKey = next?.storageKey;
        state.source = next?.source;
        pubsub.publish({ type: 'storage_key', source: state.source });
    };

    const getAdapter = (source: StorageKeySource): StorageKeyAdapter => {
        const adapter = adapters[source];
        if (!adapter) throw new Error('Unsupported storage key adapter');
        return adapter;
    };

    const generateAdapterKeyId = (source: StorageKeySource) => {
        if (checkLegacyMode()) return STORAGE_KEY_IDB_ID;
        return `adapter::${source}::${uniqueId()}`;
    };

    const service = {
        get source() {
            return state.source;
        },

        listen: pubsub.subscribe,

        init: async (options: StorageKeyInitOptions): Promise<void> => {
            if (state.storageKey) return logger.info('[storage-key] already initialized');

            const { keyRef, confirm } = options;
            if (!keyRef) return service.generate({ source: options.default ?? config.default, confirm });

            const { source } = keyRef;

            const result = await (async (): Promise<StorageKeyResult> => {
                if (!validateStorageKeySalt(keyRef.salt)) return { ok: false, error: StorageKeyError.CORRUPTED };
                const adapter = getAdapter(source);
                return adapter.read(keyRef);
            })();

            if (!result.ok) {
                /** If we cannot access the adapter's secret during init
                 * then we should allow the user to retry with current
                 * key reference OR re-generate a key from scratch */
                const retry = await confirm({
                    operation: 'read',
                    message: formatReadError(result.error),
                    warning: formatResetKeyWarning(),
                    cancelable: true,
                });

                if (retry) return service.init(options);
                else return service.generate({ source: config.default, confirm });
            }

            const storageKey = await deriveStorageKey(result.key, keyRef.salt);
            logger.info(`[adapter::${StorageKeySource[source].toLowerCase()}] adapter key resolved`);
            setState({ storageKey, source });
        },

        read: () => {
            if (!state.storageKey) throw new Error('Storage key not initialized');
            return state.storageKey;
        },

        generate: async (options: StorageKeyGenerateOptions): Promise<void> => {
            const { confirm } = options;
            const source = options.source ?? config.default;
            const adapter = getAdapter(source);
            const adapterId = StorageKeySource[source].toLowerCase();

            if (source === state.source) {
                logger.info(`[adapter::${adapterId}] key exists, skipping..`);
                return;
            }

            try {
                /** Check if we can gracefully downgrade the key source in
                 * case of generation failure for the current source */
                const allowDowngrade = Boolean(!options.source && adapter.downgrade);
                const unsafeWarning = allowDowngrade && adapter.downgrade === StorageKeySource.FALLBACK;

                const adapterKeyId = generateAdapterKeyId(adapter.type);
                const result = await adapter.generate(adapterKeyId);

                if (!result.ok) {
                    const retry = await confirm({
                        operation: 'generate',
                        message: formatGenerateError(result.error),
                        warning: formatUnsafeStorageKeyWarning(unsafeWarning),
                        cancelable: allowDowngrade,
                    });

                    if (retry) return await service.generate(options);
                    else if (allowDowngrade) return await service.generate({ ...options, source: adapter.downgrade });
                    else throw new Error('Failed generating storage key');
                }

                const salt = generateStorageKeySalt();
                const storageKey = await deriveStorageKey(result.key, salt);

                /** Prepare & save the storage key ref */
                const storageKeyRef: StorageKeyRef = { source, salt, id: STORAGE_KEY_IDB_ID, adapterKeyId };
                storageKeyRef.unsafe_key = source === StorageKeySource.FALLBACK ? result.key : undefined;
                if (checkLegacyMode()) delete storageKeyRef.adapterKeyId;

                const current = { ...state };
                const rotated = current.storageKey !== undefined;
                const onSaved = () => setState({ storageKey, source });

                await config.onStorageKey(storageKeyRef, { rotated, onSaved }).catch((err) => {
                    /** Rollback to previous state if `onStorageKey` throws.
                     * `onStorageKey` should use a DB transaction to properly
                     * rollback if anything fails during key rotation */
                    setState(current);
                    throw err;
                });

                /** Sanity check in-case `onSaved` wasn't called during the
                 * `StorageKeyConfig::onStorageKey` callback. */
                if (state.storageKey !== storageKey) onSaved();

                logger.info(`[adapter::${adapterId}] key generated`);
            } catch (err) {
                logger.warn(`[adapter::${adapterId}] key generation failure ${err}`);
                const message = `Storage key generation failure: ${err instanceof Error ? err.message : 'Unknown error'}`;
                throw new Error(message);
            }
        },
    };

    return service;
};
