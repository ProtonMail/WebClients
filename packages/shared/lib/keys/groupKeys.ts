import type { PrivateKeyReference } from '@proton/crypto';
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
import { removePrimary } from './add/addAddressKeyHelper';
import {
    decryptAddressKeyUsingOrgKeyToken,
    generateAddressKey,
    getDecryptedAddressKey,
    getNewAddressKeyTokenFromOrgKey,
} from './addressKeys';
import { getActiveKeyObject, getActiveKeys, getNormalizedActiveKeys } from './getActiveKeys';
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
    const newActiveKey = await getActiveKeyObject(privateKey, {
        ID: 'tmp',
        primary: 1,
        flags: getDefaultKeyFlags(address),
    });

    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, []); // v6 keys should not be present for groups

    const updatedActiveKeys = getNormalizedActiveKeys(address, { v4: [newActiveKey, ...activeKeys.v4.map(removePrimary)], v6: activeKeys.v6 });
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
