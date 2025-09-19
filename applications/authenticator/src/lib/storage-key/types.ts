import type { Result } from '@proton/pass/types';

export enum StorageKeyError {
    CORRUPTED = 'CORRUPTED',
    NO_EXIST = 'NO_EXIST',
    PLATFORM = 'PLATFORM',
    UNKNOWN = 'UNKNOWN',
}

export enum StorageKeySource {
    /** storage key stored in OS keyring */
    KEYRING,
    /** storage key derived from local password */
    PASSWORD,
    /** storage key  */
    FALLBACK,
}

/** Storage key reference */
export type StorageKeyRef = {
    id: string;
    /** Starting on v1.1.4 - each generated adapter storage
     * key should have a unique `adapterKeyId`. This only
     * affects keyring adapter resolution */
    adapterKeyId?: string;
    salt: Uint8Array<ArrayBuffer>;
    source: StorageKeySource;
    /**
     * @deprecated
     * NOTE: this should only by set for `FALLBACK` mode.
     * Flagging as deprecated so it's obvious in the IDE
     */
    unsafe_key?: Uint8Array<ArrayBuffer>;
};

export type StorageKeyResult = Result<{ key: Uint8Array<ArrayBuffer> }, { error: StorageKeyError }>;

export interface StorageKeyAdapter<T extends StorageKeySource = StorageKeySource> {
    type: T;
    downgrade?: StorageKeySource;
    upgrade?: StorageKeySource;
    read: (ref: StorageKeyRef) => Promise<StorageKeyResult>;
    generate: (keyId: string) => Promise<StorageKeyResult>;
}
