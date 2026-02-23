import { type PrivateKeyReferenceV4, toPublicKeyReference } from '@proton/crypto';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import type { KTVerifier } from '@proton/key-transparency/helpers';

import { createAddressKeyRouteV2 } from '../../api/keys';
import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../../constants';
import type {
    ActiveAddressKeysByVersion,
    ActiveKey,
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    KeyTransparencyActivation,
    KeyTransparencyVerify,
    UserModel,
} from '../../interfaces';
import {
    addAddressKeysProcess,
    getActiveKeyObject,
    getDefaultKeyFlags,
    getNormalizedActiveAddressKeys,
    getPrimaryAddressKeysForSigning,
    getSignedKeyListWithDeferredPublish,
    unsetV6PrimaryAddressKey,
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

export const handleUnsetV6PrimaryKey = async ({
    ID,
    api,
    forwarderAddress,
    addressKeys,
    User,
    userKeys,
    ktVerifier,
    ktActivation,
}: {
    ID: string;
    api: Api;
    forwarderAddress: Address;
    addressKeys: DecryptedAddressKey[];
    User: UserModel;
    userKeys: DecryptedKey[];
    ktVerifier: KTVerifier;
    ktActivation: KeyTransparencyActivation;
}) => {
    const addressKey = addressKeys.find(({ ID: otherID }) => otherID === ID);
    if (!addressKey) {
        throw new Error('Key not found');
    }

    const { keyTransparencyVerify, keyTransparencyCommit } = ktVerifier;
    const [newActiveKeys, formerActiveKeys] = await unsetV6PrimaryAddressKey(
        api,
        forwarderAddress,
        addressKeys,
        ID,
        keyTransparencyVerify
    );
    await Promise.all([
        resignSKLWithPrimaryKey({
            api,
            ktActivation,
            address: forwarderAddress,
            newPrimaryKeys: getPrimaryAddressKeysForSigning(newActiveKeys, true),
            formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
            userKeys,
        }),
        keyTransparencyCommit(User, userKeys),
    ]);
    return newActiveKeys;
};

export const generateNewE2EEForwardingCompatibleAddressKey = async ({
    api,
    forwarderAddress,
    addresses,
    addressKeys,
    User,
    userKeys,
    ktVerifier,
    keyPassword,
}: {
    api: Api;
    forwarderAddress: Address;
    addresses: Address[];
    addressKeys: DecryptedAddressKey[];
    User: UserModel;
    userKeys: DecryptedKey[];
    ktVerifier: KTVerifier;
    keyPassword: string;
}) => {
    const { keyTransparencyVerify, keyTransparencyCommit } = ktVerifier;
    const [newKey] = await addAddressKeysProcess({
        api,
        userKeys,
        keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
        addresses,
        address: forwarderAddress,
        addressKeys,
        keyPassword,
        keyTransparencyVerify,
    });

    await keyTransparencyCommit(User, userKeys);

    return newKey as ActiveKey<PrivateKeyReferenceV4>;
};
