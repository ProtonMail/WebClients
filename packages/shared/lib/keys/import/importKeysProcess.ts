import type { Address, DecryptedKey, KeyTransparencyVerify } from '../../interfaces';
import { getPrimaryKey } from '../getPrimaryKey';
import { getHasMigratedAddressKeys } from '../keyMigration';
import type { ImportKeysProcessLegacyArguments } from './importKeysProcessLegacy';
import importKeysProcessLegacy from './importKeysProcessLegacy';
import type { ImportKeysProcessV2Arguments } from './importKeysProcessV2';
import importKeysProcessV2 from './importKeysProcessV2';

interface Arguments extends Omit<ImportKeysProcessV2Arguments, 'userKey'>, ImportKeysProcessLegacyArguments {
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
    onImport,
    keyTransparencyVerify,
}: Arguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    if (hasMigratedAddressKeys) {
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
            onImport,
            userKey: primaryPrivateUserKey,
            keyTransparencyVerify,
        });
    }

    return importKeysProcessLegacy({
        api,
        keyImportRecords,
        keyPassword,
        address,
        addressKeys,
        onImport,
        keyTransparencyVerify,
    });
};
