import { getReplacedAddressKeyTokens } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { createUserKeyRoute, replaceAddressTokens } from '../../api/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../../constants';
import { Address, Api, DecryptedKey, EncryptionConfig, KeyTransparencyVerify } from '../../interfaces';
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
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const addAddressKeysProcess = async ({
    api,
    encryptionConfig,
    addresses,
    address,
    addressKeys,
    userKeys,
    keyPassword,
    keyTransparencyVerify,
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
            keyTransparencyVerify,
        });
    }

    return createAddressKeyLegacy({
        api,
        address,
        encryptionConfig,
        passphrase: keyPassword,
        activeKeys,
        keyTransparencyVerify,
    });
};

interface CreateAddressKeyLegacyArguments {
    api: Api;
    encryptionConfig?: EncryptionConfig;
    userKeys: DecryptedKey[];
    addresses: Address[];
    passphrase: string;
}

export const addUserKeysProcess = async ({
    api,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    userKeys,
    addresses,
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

    if (getHasMigratedAddressKeys(addresses)) {
        const replacedResult = await getReplacedAddressKeyTokens({ userKeys, addresses, privateKey });
        if (replacedResult.AddressKeyTokens.length) {
            await api(replaceAddressTokens(replacedResult)).catch(/*ignore failures */ noop);
        }
    }

    return privateKey;
};
