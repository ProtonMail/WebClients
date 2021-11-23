import { OpenPGPKey } from 'pmcrypto';
import { ActiveKey, Address, Api, EncryptionConfig } from '../../interfaces';
import { createAddressKeyRoute, createAddressKeyRouteV2 } from '../../api/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from '../../constants';
import { generateAddressKey, generateAddressKeyTokens } from '../addressKeys';
import { getActiveKeyObject } from '../getActiveKeys';
import { getSignedKeyList } from '../signedKeyList';

interface CreateAddressKeyLegacyArguments {
    api: Api;
    encryptionConfig?: EncryptionConfig;
    address: Address;
    passphrase: string;
    activeKeys: ActiveKey[];
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
}: CreateAddressKeyLegacyArguments) => {
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase,
        encryptionConfig,
    });
    const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: 1 });
    const updatedActiveKeys = [newActiveKey, ...activeKeys.map(removePrimary)];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

    const { Key } = await api(
        createAddressKeyRoute({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
        })
    );
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys] as const;
};

interface CreateAddressKeyV2Arguments {
    api: Api;
    userKey: OpenPGPKey;
    encryptionConfig?: EncryptionConfig;
    address: Address;
    activeKeys: ActiveKey[];
}

export const createAddressKeyV2 = async ({
    api,
    userKey,
    encryptionConfig = ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
    address,
    activeKeys,
}: CreateAddressKeyV2Arguments) => {
    const { token, encryptedToken, signature } = await generateAddressKeyTokens(userKey);
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: token,
        encryptionConfig,
    });
    const newActiveKey = await getActiveKeyObject(privateKey, { ID: 'tmp', primary: 1 });
    const updatedActiveKeys = [newActiveKey, ...activeKeys.map(removePrimary)];
    const SignedKeyList = await getSignedKeyList(updatedActiveKeys);

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
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys] as const;
};
