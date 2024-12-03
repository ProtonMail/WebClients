import { CryptoProxy } from '@proton/crypto';
import { activatePasswordlessKey } from '@proton/shared/lib/api/members';
import {
    getIsPasswordless,
    getReplacedAddressKeyTokens,
    isKeyGenConfigV6,
    reencryptOrganizationToken,
    splitKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { createUserKeyRoute, replaceAddressTokens } from '../../api/keys';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '../../constants';
import type {
    Address,
    Api,
    CachedOrganizationKey,
    DecryptedAddressKey,
    DecryptedKey,
    KeyGenConfig,
    KeyGenConfigV6,
    KeyTransparencyVerify,
    UserModel,
} from '../../interfaces';
import { storeDeviceRecovery } from '../../recoveryFile/deviceRecovery';
import { getActiveAddressKeys } from '../getActiveKeys';
import { getHasMigratedAddressKeys } from '../keyMigration';
import { generateUserKey } from '../userKeys';
import { createAddressKeyLegacy, createAddressKeyV2 } from './addAddressKeyHelper';

interface AddAddressKeysProcessArguments {
    api: Api;
    addressKeys: DecryptedAddressKey[];
    userKeys: DecryptedKey[];
    address: Address;
    addresses: Address[];
    keyGenConfig: KeyGenConfig | KeyGenConfigV6;
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

    const activeKeys = await getActiveAddressKeys(address.SignedKeyList, addressKeys);

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

    if (isKeyGenConfigV6(keyGenConfig)) {
        throw new Error('Cannot generate v6 keys with non-migrated address');
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
    keyGenConfig?: KeyGenConfig | KeyGenConfigV6;
    user: UserModel;
    userKeys: DecryptedKey[];
    addresses: Address[];
    passphrase: string;
    isDeviceRecoveryAvailable?: boolean;
    isDeviceRecoveryEnabled?: boolean;
    organizationKey?: CachedOrganizationKey;
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
        // since we already have the armored private key, we avoid calling the
        // `toPublicKeyReference` helper which internally re-exports the key
        const publicKey = await CryptoProxy.importPublicKey({ armoredKey: privateKeyArmored });
        await storeDeviceRecovery({
            api,
            user,
            userKeys: [{ ID: 'tmp-id', privateKey, publicKey }, ...userKeys],
        });
    }

    return privateKey;
};
