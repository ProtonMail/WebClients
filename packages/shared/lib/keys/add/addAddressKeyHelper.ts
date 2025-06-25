import { toPublicKeyReference } from '@proton/crypto';

import { createAddressKeyRoute, createAddressKeyRouteV2 } from '../../api/keys';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '../../constants';
import {
    type ActiveAddressKeysByVersion,
    type ActiveKey,
    type ActiveKeyWithVersion,
    type Address,
    type Api,
    type KeyGenConfig,
    type KeyGenConfigV6,
    type KeyPair,
    type KeyTransparencyVerify,
    isActiveKeyV6,
} from '../../interfaces';
import { generateAddressKey, getNewAddressKeyToken } from '../addressKeys';
import { getActiveKeyObject, getNormalizedActiveAddressKeys } from '../getActiveKeys';
import { getDefaultKeyFlags } from '../keyFlags';
import { getSignedKeyListWithDeferredPublish } from '../signedKeyList';

interface CreateAddressKeyLegacyArguments {
    api: Api;
    keyGenConfig?: KeyGenConfig; // no v6 key support for non-migrated users
    address: Address;
    passphrase: string;
    activeKeys: ActiveAddressKeysByVersion;
    keyTransparencyVerify: KeyTransparencyVerify;
    addressForwardingID?: string;
}

export const removePrimary = <T extends ActiveKey>(activeKey: T): T => {
    if (activeKey.primary) {
        return {
            ...activeKey,
            primary: 0,
        };
    }
    return activeKey;
};

export const createAddressKeyLegacy = async ({
    api,
    address,
    keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
    passphrase,
    activeKeys,
    keyTransparencyVerify,
    addressForwardingID: AddressForwardingID,
}: CreateAddressKeyLegacyArguments) => {
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase,
        keyGenConfig,
    });
    const publicKey = await toPublicKeyReference(privateKey);
    const newActiveKey = await getActiveKeyObject(privateKey, publicKey, {
        ID: 'tmp',
        primary: 1,
        flags: getDefaultKeyFlags(address),
    });
    // no v6 keys allowed with non-migrated keys
    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
        v4: [newActiveKey, ...activeKeys.v4.map(removePrimary)],
        v6: [],
    });
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        address,
        keyTransparencyVerify
    );
    const { Key } = await api(
        createAddressKeyRoute({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
            AddressForwardingID,
        })
    );
    await onSKLPublishSuccess();
    newActiveKey.ID = Key.ID;

    const formerActiveKeys = activeKeys;
    return [newActiveKey, updatedActiveKeys, formerActiveKeys] as const;
};

interface CreateAddressKeyV2Arguments {
    api: Api;
    userKeys: KeyPair[];
    keyGenConfig?: KeyGenConfig | KeyGenConfigV6;
    address: Address;
    activeKeys: ActiveAddressKeysByVersion;
    keyTransparencyVerify: KeyTransparencyVerify;
}

/**
 * Generates either a v4 or v6 address key based on `keyGenConfig`.
 * NB: if a v6 key is requested, this does not take care of also generating a v4 one.
 */
export const createAddressKeyV2 = async ({
    api,
    userKeys,
    keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
    address,
    activeKeys,
    keyTransparencyVerify,
}: CreateAddressKeyV2Arguments) => {
    const { token, encryptedToken, signature } = await getNewAddressKeyToken({ address, userKeys });

    const { privateKey, privateKeyArmored } = await generateAddressKey({
        // also typeof keyGenConfig
        email: address.Email,
        passphrase: token,
        keyGenConfig,
    });
    const publicKey = await toPublicKeyReference(privateKey);
    const newActiveKey = (await getActiveKeyObject(privateKey, publicKey, {
        ID: 'tmp',
        primary: 1,
        flags: getDefaultKeyFlags(address),
    })) as ActiveKeyWithVersion;

    const toNormalize = isActiveKeyV6(newActiveKey)
        ? { v4: [...activeKeys.v4], v6: [newActiveKey, ...activeKeys.v6.map(removePrimary)] }
        : { v4: [newActiveKey, ...activeKeys.v4.map(removePrimary)], v6: [...activeKeys.v6] };

    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, toNormalize);

    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        address,
        keyTransparencyVerify
    );
    const { Key } = await api(
        createAddressKeyRouteV2({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
            Signature: signature,
            Token: encryptedToken,
        })
    );
    // Only once the SKL is successfully posted we add it to the KT commit state.
    await onSKLPublishSuccess();
    newActiveKey.ID = Key.ID;

    const formerActiveKeys = activeKeys;
    return [newActiveKey, updatedActiveKeys, formerActiveKeys] as const;
};
