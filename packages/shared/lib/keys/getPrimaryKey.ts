import type { PrivateKeyReferenceV4, PrivateKeyReferenceV6 } from '@proton/crypto';

import type { ActiveAddressKeysByVersion, KeyPair } from '../interfaces';

export const getPrimaryKey = <T extends KeyPair>(keys: T[] = []): T | undefined => {
    return keys[0];
};

export type PrimaryAddressKeys = [PrivateKeyReferenceV4] | [PrivateKeyReferenceV4, PrivateKeyReferenceV6];
export const getPrimaryAddressKeysForSigningByVersion = (keys: ActiveAddressKeysByVersion): PrimaryAddressKeys => {
    const v4PrimaryKeys = keys.v4.filter(({ primary }) => !!primary);
    const v6PrimaryKeys = keys.v6.filter(({ primary }) => !!primary);
    if (v4PrimaryKeys.length === 0 || v4PrimaryKeys.length > 1 || v6PrimaryKeys.length > 1) {
        throw new Error('Unexpected number of primary keys');
    }
    return v6PrimaryKeys.length > 0
        ? [v4PrimaryKeys[0].privateKey, v6PrimaryKeys[0].privateKey]
        : [v4PrimaryKeys[0].privateKey];
};
