import { CryptoProxy } from '@proton/crypto';
import { activatePasswordlessKey } from '@proton/shared/lib/api/members';
import {
    getIsPasswordless,
    getReplacedAddressKeyTokens,
    reencryptOrganizationToken,
    splitKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { createUserKeyRoute, replaceAddressTokens } from '../../api/keys';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '../../constants';
import {
    Address,
    Api,
    CachedOrganizationKey,
    DecryptedKey,
    KeyGenConfig,
    KeyTransparencyVerify,
    UserModel,
} from '../../interfaces';
import { storeDeviceRecovery } from '../../recoveryFile/deviceRecovery';
import { getActiveKeys } from '../getActiveKeys';
import { getHasMigratedAddressKeys } from '../keyMigration';
import { generateUserKey } from '../userKeys';
import { createAddressKeyLegacy, createAddressKeyV2 } from './addAddressKeyHelper';

interface AddAddressKeysProcessArguments {
    api: Api;
    addressKeys: DecryptedKey[];
    userKeys: DecryptedKey[];
    address: Address;
    addresses: Address[];
    keyGenConfig: KeyGenConfig;
    keyPassword: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const addAddressKeysProcess = async ({
    api,
    keyGenConfig,
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
        return createAddressKeyV2({
            api,
            userKeys,
            keyGenConfig,
            activeKeys,
            address,
            keyTransparencyVerify,
        });
    }

    return createAddressKeyLegacy({
        api,
        address,
        keyGenConfig,
        passphrase: keyPassword,
        activeKeys,
        keyTransparencyVerify,
    });
};

interface AddUserKeysProcessArguments {
    api: Api;
    keyGenConfig?: KeyGenConfig;
    user: UserModel;
    userKeys: DecryptedKey[];
    addresses: Address[];
    passphrase: string;
    isDeviceRecoveryAvailable?: boolean;
    isDeviceRecoveryEnabled?: boolean;
    organizationKey?: CachedOrganizationKey;
    call: () => Promise<void>;
}

export const addUserKeysProcess = async ({
    api,
    keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
    user,
    userKeys,
    addresses,
    passphrase,
    organizationKey,
    isDeviceRecoveryAvailable,
    isDeviceRecoveryEnabled,
    call,
}: AddUserKeysProcessArguments) => {
    const { privateKey, privateKeyArmored } = await generateUserKey({
        passphrase,
        keyGenConfig,
    });

    await api(
        createUserKeyRoute({
            Primary: 1,
            PrivateKey: privateKeyArmored,
        })
    );

    const splitUserKeys = splitKeys(userKeys);

    if (getHasMigratedAddressKeys(addresses)) {
        const replacedResult = await getReplacedAddressKeyTokens({
            privateKeys: splitUserKeys.privateKeys,
            addresses,
            privateKey,
        });
        if (replacedResult.AddressKeyTokens.length) {
            await api(replaceAddressTokens(replacedResult)).catch(/*ignore failures */ noop);
        }
    }

    if (getIsPasswordless(organizationKey?.Key) && organizationKey?.privateKey) {
        const result = await reencryptOrganizationToken({
            Token: organizationKey.Key.Token,
            encryptionKey: privateKey,
            signingKey: privateKey,
            decryptionKeys: splitUserKeys.privateKeys,
        });
        await api(
            activatePasswordlessKey({
                TokenKeyPacket: result.keyPacket,
                Signature: result.signature,
            })
        ).catch(/*ignore failures */ noop);
    }

    // Store a new device recovery immediately to avoid having the storing trigger asynchronously which would cause red notification flashes
    if (isDeviceRecoveryAvailable && isDeviceRecoveryEnabled) {
        const publicKey = await CryptoProxy.importPublicKey({
            binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
        });
        await storeDeviceRecovery({
            api,
            user,
            userKeys: [{ ID: 'tmp-id', privateKey, publicKey }, ...userKeys],
        });
    }
    await call();

    return privateKey;
};
