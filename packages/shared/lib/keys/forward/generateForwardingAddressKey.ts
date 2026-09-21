import { type PrivateKeyReferenceV4, toPublicKeyReference } from '@protontech/crypto';

import { createAddressKeyRouteV2 } from '../../api/keys';
import type { ActiveAddressKeysByVersion, Address, Api, KeyTransparencyVerify } from '../../interfaces';
import {
    getActiveKeyObject,
    getDefaultKeyFlags,
    getNormalizedActiveAddressKeys,
    getSignedKeyListWithDeferredPublish,
} from '../../keys';

export interface ForwardingAddressKeyParameters {
    api: Api;
    privateKey: PrivateKeyReferenceV4; // v6 keys do not support forwarding (yet)
    address: Address;
    activeKeys: ActiveAddressKeysByVersion;
    privateKeyArmored: string;
    signature: string;
    encryptedToken: string;
    addressForwardingID?: string; // for personal forwardings only, mutually exclusive with `groupMemberID`
    groupMemberID?: string; // for groups only, mutually exclusive with `addressForwardingID`
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const generateForwardingAddressKey = async ({
    api,
    privateKey,
    address,
    activeKeys,
    privateKeyArmored,
    signature,
    encryptedToken,
    addressForwardingID,
    groupMemberID,
    keyTransparencyVerify,
}: ForwardingAddressKeyParameters) => {
    const publicKey = await toPublicKeyReference(privateKey);
    const newActiveKey = await getActiveKeyObject(privateKey, publicKey, {
        ID: 'tmp',
        primary: 0,
        flags: getDefaultKeyFlags(address),
    });
    const updatedActiveKeys = getNormalizedActiveAddressKeys(address, {
        v4: [...activeKeys.v4, newActiveKey],
        v6: [...activeKeys.v6],
    });

    // The SKL isn't actually different from the existing one, since forwarding keys are not included.
    // We still re-generate it here since it's needed by `createAddressKeyRouteV2`.
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        updatedActiveKeys, // could also pass `activeKeys` since forwarding keys are ignored
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
            AddressForwardingID: addressForwardingID,
            GroupMemberID: groupMemberID,
        })
    );
    await onSKLPublishSuccess();
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys] as const;
};
