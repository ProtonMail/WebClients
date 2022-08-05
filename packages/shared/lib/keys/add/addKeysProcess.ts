import { createUserKeyRoute } from '../../api/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../../constants';
import { Address, Api, DecryptedKey, EncryptionConfig } from '../../interfaces';
import { getActiveKeys } from '../getActiveKeys';
import { getPrimaryKey } from '../getPrimaryKey';
import { getHasMigratedAddressKeys } from '../keyMigration';
import { generateUserKey } from '../userKeys';
import { createAddressKeyLegacy, createAddressKeyV2 } from './addAddressKeyHelper';

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

    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys);

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

interface CreateAddressKeyLegacyArguments {
    api: Api;
    encryptionConfig?: EncryptionConfig;
    passphrase: string;
}

export const addUserKeysProcess = async ({
    api,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    passphrase,
}: CreateAddressKeyLegacyArguments) => {
    const { privateKey, privateKeyArmored } = await generateUserKey({
        passphrase,
        encryptionConfig,
    });

    await api(
        createUserKeyRoute({
            Primary: 1,
            PrivateKey: privateKeyArmored,
        })
    );

    return privateKey;
};
