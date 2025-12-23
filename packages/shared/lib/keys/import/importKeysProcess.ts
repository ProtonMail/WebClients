import type { Address, DecryptedKey, KeyTransparencyVerify } from '../../interfaces';
import { getPrimaryKey } from '../getPrimaryKey';
import { getHasMigratedAddressKeys } from '../keyMigration';
import type { ImportKeysProcessV2Arguments } from './importKeysProcessV2';
import importKeysProcessV2 from './importKeysProcessV2';

interface Arguments extends Omit<ImportKeysProcessV2Arguments, 'userKey'> {
    addresses: Address[];
    userKeys: DecryptedKey[];
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const importKeysProcess = async ({
    api,
    userKeys,
    address,
    addressKeys,
    addresses,
    keyImportRecords,
    keyPassword,
    keyTransparencyVerify,
}: Arguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    if (!hasMigratedAddressKeys) {
        // this should be unreachable migration runs on either on login or password reset
        throw new Error('Migrated address keys expected');
    }
    const primaryPrivateUserKey = getPrimaryKey(userKeys)?.privateKey;
    if (!primaryPrivateUserKey) {
        throw new Error('Missing primary private user key');
    }
    return importKeysProcessV2({
        api,
        keyImportRecords,
        keyPassword,
        address,
        addressKeys,
        userKey: primaryPrivateUserKey,
        keyTransparencyVerify,
    });
};
