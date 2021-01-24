import { getHasMigratedAddressKeys } from '../keyMigration';
import importKeysProcessLegacy, { ImportKeysProcessLegacyArguments } from './importKeysProcessLegacy';
import importKeysProcessV2, { ImportKeysProcessV2Arguments } from './importKeysProcessV2';
import { Address, DecryptedKey } from '../../interfaces';
import { getPrimaryKey } from '../getPrimaryKey';

interface Arguments extends Omit<ImportKeysProcessV2Arguments, 'userKey'>, ImportKeysProcessLegacyArguments {
    addresses: Address[];
    userKeys: DecryptedKey[];
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
        });
    }

    return importKeysProcessLegacy({
        api,
        keyImportRecords,
        keyPassword,
        address,
        addressKeys,
        onImport,
    });
};
