import { PrivateKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys';

import { createAddressKeyRoute, createAddressKeyRouteV2 } from '../../api/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../../constants';
import { ActiveKey, Address, Api, EncryptionConfig, KeyTransparencyVerify } from '../../interfaces';
import { generateAddressKey, generateAddressKeyTokens } from '../addressKeys';
import { getActiveKeyObject, getNormalizedActiveKeys } from '../getActiveKeys';
import { getSignedKeyListWithDeferredPublish } from '../signedKeyList';

interface CreateAddressKeyLegacyArguments {
    api: Api;
    encryptionConfig?: EncryptionConfig;
    address: Address;
    passphrase: string;
    activeKeys: ActiveKey[];
    keyTransparencyVerify: KeyTransparencyVerify;
    addressForwardingID?: string;
}

const removePrimary = (activeKey: ActiveKey): ActiveKey => {
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
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    passphrase,
    activeKeys,
    keyTransparencyVerify,
    addressForwardingID: AddressForwardingID,
}: CreateAddressKeyLegacyArguments) => {
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase,
        encryptionConfig,
    });
    const newActiveKey = await getActiveKeyObject(privateKey, {
        ID: 'tmp',
        primary: 1,
        flags: getDefaultKeyFlags(address),
    });
    const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey, ...activeKeys.map(removePrimary)]);
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

    return [newActiveKey, updatedActiveKeys] as const;
};

interface CreateAddressKeyV2Arguments {
    api: Api;
    userKey: PrivateKeyReference;
    encryptionConfig?: EncryptionConfig;
    address: Address;
    activeKeys: ActiveKey[];
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const createAddressKeyV2 = async ({
    api,
    userKey,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    address,
    activeKeys,
    keyTransparencyVerify,
}: CreateAddressKeyV2Arguments) => {
    const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: token,
        encryptionConfig,
    });
    const newActiveKey = await getActiveKeyObject(privateKey, {
        ID: 'tmp',
        primary: 1,
        flags: getDefaultKeyFlags(address),
    });
    const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey, ...activeKeys.map(removePrimary)]);
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

    return [newActiveKey, updatedActiveKeys] as const;
};
