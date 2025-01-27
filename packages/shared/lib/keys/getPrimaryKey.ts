import type { PrivateKeyReferenceV4, PrivateKeyReferenceV6 } from '@proton/crypto';

import type { ActiveAddressKeysByVersion, ActiveKey, KeyPair } from '../interfaces';

export const getPrimaryKey = <T extends KeyPair>(keys: T[] = []): T | undefined => {
    return keys[0];
};

// For conveniency, a PrivateKeyReference is used for the encryption key here just to retain
// the key version TS information, and avoid introducing a versioned PublicKeyReference
export type PrimaryAddressKeyForEncryption = PrivateKeyReferenceV4 | PrivateKeyReferenceV6;
export const getPrimaryActiveAddressKeyForEncryption = (
    keys: ActiveAddressKeysByVersion,
    allowV6Keys: boolean
): ActiveKey<PrimaryAddressKeyForEncryption> => {
    const v4PrimaryKeys = keys.v4.filter(({ primary }) => !!primary);
    const v6PrimaryKeys = keys.v6.filter(({ primary }) => !!primary);
    if (v4PrimaryKeys.length === 0 || v4PrimaryKeys.length > 1 || v6PrimaryKeys.length > 1) {
        throw new Error('Unexpected number of primary keys');
    }
    return allowV6Keys && v6PrimaryKeys.length > 0 ? v6PrimaryKeys[0] : v4PrimaryKeys[0];
};

export type PrimaryAddressKeysForSigning = [PrivateKeyReferenceV4] | [PrivateKeyReferenceV4, PrivateKeyReferenceV6];
export const getPrimaryAddressKeysForSigning = (
    keys: ActiveAddressKeysByVersion,
    allowV6Keys: boolean
): PrimaryAddressKeysForSigning => {
    const v4PrimaryKeys = keys.v4.filter(({ primary }) => !!primary);
    const v6PrimaryKeys = keys.v6.filter(({ primary }) => !!primary);
    if (v4PrimaryKeys.length === 0 || v4PrimaryKeys.length > 1 || v6PrimaryKeys.length > 1) {
        throw new Error('Unexpected number of primary keys');
    }
    return allowV6Keys && v6PrimaryKeys.length > 0
        ? [v4PrimaryKeys[0].privateKey, v6PrimaryKeys[0].privateKey]
        : [v4PrimaryKeys[0].privateKey];
};
