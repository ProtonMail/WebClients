import { type PrivateKeyReference, toPublicKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys/keyFlags';
import noop from '@proton/utils/noop';

import { createGroupAddressKeyRoute } from '../api/keys';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '../constants';
import type {
    Address,
    Api,
    CachedOrganizationKey,
    DecryptedAddressKey,
    Key,
    KeyGenConfig,
    KeyTransparencyVerify,
    RequireSome,
} from '../interfaces';
import {
    decryptAddressKeyUsingOrgKeyToken,
    generateAddressKey,
    getDecryptedAddressKey,
    getNewAddressKeyTokenFromOrgKey,
} from './addressKeys';
import { getActiveKeyObject, getNormalizedActiveAddressKeys } from './getActiveKeys';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';

type AddressKey = RequireSome<Key, 'Flags' | 'Signature' | 'AddressForwardingID'>;

interface CreateGroupAddressKeyArguments {
    api: Api;
    organizationKey: CachedOrganizationKey;
    keyGenConfig?: KeyGenConfig; // v6 keys not supported for groups
    address: Address;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const createGroupAddressKey = async ({
    api,
    organizationKey,
    keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
    address,
    keyTransparencyVerify,
}: CreateGroupAddressKeyArguments) => {
    const { token, encryptedToken, signature } = await getNewAddressKeyTokenFromOrgKey({ address, organizationKey });
    const { privateKey, privateKeyArmored } = await generateAddressKey({
        email: address.Email,
        passphrase: token,
        keyGenConfig,
    });
    const publicKey = await toPublicKeyReference(privateKey);
    const newActiveKey = await getActiveKeyObject(privateKey, publicKey, {
        ID: 'tmp',
        primary: 1,
        flags: getDefaultKeyFlags(address),
    });

    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
        v4: [newActiveKey],
        v6: [], // v6 keys should not be present for groups
    });
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys,
        address,
        keyTransparencyVerify
    );
    const { Key } = await api(
        createGroupAddressKeyRoute({
            AddressID: address.ID,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
            OrgSignature: signature,
            OrgToken: encryptedToken,
        })
    );
    // Only once the SKL is successfully posted we add it to the KT commit state.
    await onSKLPublishSuccess();
    newActiveKey.ID = Key.ID;

    return [Key];
};

export const getDecryptedGroupAddressKey = async (
    addressKeys: AddressKey[],
    organizationKey: PrivateKeyReference
): Promise<DecryptedAddressKey | undefined> => {
    const [primaryKey] = addressKeys;
    const { Token, Signature } = primaryKey;

    if (Token) {
        const primaryKeyResult = await decryptAddressKeyUsingOrgKeyToken({ Token, organizationKey, Signature })
            .then((password) => getDecryptedAddressKey(primaryKey, password))
            .catch(noop);

        return Promise.resolve(primaryKeyResult);
    }

    return undefined;
};
