import { getDefaultKeyFlags } from '@proton/shared/lib/keys/keyFlags';

import { createGroupAddressKeyRoute } from '../api/keys';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '../constants';
import { Address, Api, CachedOrganizationKey, KeyGenConfig, KeyTransparencyVerify } from '../interfaces';
import { removePrimary } from './add/addAddressKeyHelper';
import { generateAddressKey, getNewAddressKeyTokenFromOrgKey } from './addressKeys';
import { getActiveKeyObject, getActiveKeys, getNormalizedActiveKeys } from './getActiveKeys';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';

interface CreateGroupAddressKeyArguments {
    api: Api;
    organizationKey: CachedOrganizationKey;
    keyGenConfig?: KeyGenConfig;
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

    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, []);

    const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey, ...activeKeys.map(removePrimary)]);
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
