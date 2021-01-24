import { createAddressKeyLegacy, createAddressKeyV2 } from './addAddressKeyHelper';
import { getHasMigratedAddressKeys } from '../keyMigration';
import { Address, Api, DecryptedKey, EncryptionConfig } from '../../interfaces';
import { getActiveKeys } from '../getActiveKeys';
import { getPrimaryKey } from '../getPrimaryKey';

interface AddAddressKeysProcessArguments {
    api: Api;
    addressKeys: DecryptedKey[];
    userKeys: DecryptedKey[];
    address: Address;
    addresses: Address[];
    encryptionConfig: EncryptionConfig;
    keyPassword: string;
}

export const addAddressKeysProcess = async ({
    api,
    encryptionConfig,
    addresses,
    address,
    addressKeys,
    userKeys,
    keyPassword,
}: AddAddressKeysProcessArguments) => {
    const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);

    const activeKeys = await getActiveKeys(address.SignedKeyList, address.Keys, addressKeys);

    if (hasMigratedAddressKeys) {
        const userKey = getPrimaryKey(userKeys)?.privateKey;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }
        return createAddressKeyV2({
            api,
            userKey,
            encryptionConfig,
            activeKeys,
            address,
        });
    }

    return createAddressKeyLegacy({
        api,
        address,
        encryptionConfig,
        passphrase: keyPassword,
        activeKeys,
    });
};
