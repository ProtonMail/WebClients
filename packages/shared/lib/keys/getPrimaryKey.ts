import isTruthy from '@proton/utils/isTruthy';

import type { ActiveKey, KeyPair } from '../interfaces';

export const getPrimaryKey = <T extends KeyPair>(keys: T[] = []): T | undefined => {
    return keys[0];
};

type PrimaryAddressKeysWithVersions = { v6?: ActiveKey; v4: ActiveKey } | { v4: undefined; v6: undefined };
/**
 * Users who have generated a v6 address key might have two primary keys instead of one.
 * This is because a v6 address key can only be marked as primary alongside a v4 key,
 * for compatibility reasons with Proton apps that do not support encrypting to v6 keys.
 * @param keys - address keys to filter
 * @returns primary address keys
 */
export const getPrimaryAddressKeysWithVersions = (keys: ActiveKey[] = []): PrimaryAddressKeysWithVersions => {
    const primaryKeys = keys.filter(({ primary }) => !!primary);
    if (primaryKeys.length > 2) {
        // sanity check
        throw new Error('Unexpected number of primary keys');
    } else {
        // the API takes care of always returning the v6 primary key first, if it exists
        const [v4Key, v6Key] = primaryKeys;
        if ((v4Key && v4Key.privateKey.getVersion() !== 4) || (v6Key && v6Key.privateKey.getVersion() !== 6)) {
            throw new Error('Unexpected primary key versions');
        }
        return { v4: v4Key, v6: v6Key };
    }
};

// TODO move elsewhere?
export const getPrimaryAddressKeysForSigning = (keys: ActiveKey[] = []): ActiveKey[] => {
    const { v4, v6 } = getPrimaryAddressKeysWithVersions(keys);
    return [v4, v6].filter(isTruthy);
};
