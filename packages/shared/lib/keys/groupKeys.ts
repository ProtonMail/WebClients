import type { ContextVerificationOptions, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, type PrivateKeyReference, toPublicKeyReference } from '@proton/crypto';
import { getDefaultKeyFlags } from '@proton/shared/lib/keys/keyFlags';
import noop from '@proton/utils/noop';

import { createGroupAddressKeyRoute, getAllPublicKeys } from '../api/keys';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '../constants';
import type {
    Address,
    Api,
    ApiKeysConfig,
    CachedOrganizationKey,
    DecryptedAddressKey,
    GetAllPublicKeysResponse,
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

export const getGroupAddressKeyPassword = async (
    addressKeys: AddressKey[],
    organizationKey: PrivateKeyReference,
    signatureContext?: ContextVerificationOptions
): Promise<string | undefined> => {
    const [primaryKey] = addressKeys;
    const { Token, Signature } = primaryKey;

    if (Token) {
        return decryptAddressKeyUsingOrgKeyToken({
            Token,
            organizationKey,
            Signature,
            signatureContext,
        }).catch(noop);
    }

    return undefined;
};

export const getDecryptedGroupAddressKey = async (
    addressKeys: AddressKey[],
    organizationKey: PrivateKeyReference,
    signatureContext?: ContextVerificationOptions
): Promise<DecryptedAddressKey | undefined> => {
    const [primaryKey] = addressKeys;

    const password = await getGroupAddressKeyPassword(addressKeys, organizationKey, signatureContext).catch(noop);

    if (password) {
        return getDecryptedAddressKey(primaryKey, password).catch(noop);
    }

    return undefined;
};

export const getGroupMemberPublicKeys = async ({
    api,
    memberEmail,
    getMemberPublicKeys,
}: {
    api: Api;
    memberEmail: string;
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
}): Promise<{
    forwardeeKeysConfig: ApiKeysConfig;
    forwardeeArmoredPrimaryPublicKey: string | undefined;
}> => {
    const [forwardeeKeysConfig, forwardeeAddressKeysResult] = await Promise.all([
        getMemberPublicKeys(memberEmail).catch(noop),
        // note: we might be able to remove the getter below, by changing getMemberPublicKeys
        // to also return keys for internal type external; or using a different function,
        // but there is no time for that
        api<GetAllPublicKeysResponse>(
            getAllPublicKeys({
                Email: memberEmail,
                InternalOnly: 1,
            })
        ).catch(noop),
    ]);

    if (!forwardeeKeysConfig) {
        throw new Error('Member public keys are undefined');
    }

    if (forwardeeKeysConfig.isCatchAll) {
        throw new Error('This address cannot be used as group member');
    }

    const allPublicKeys = [
        ...forwardeeKeysConfig.publicKeys.map((v) => v.armoredKey),
        ...(forwardeeAddressKeysResult?.Address.Keys.map((v: { PublicKey: string }) => v.PublicKey) ?? []),
    ];

    return {
        forwardeeKeysConfig,
        forwardeeArmoredPrimaryPublicKey: allPublicKeys[0],
    };
};

export const encryptGroupOwnerTokenPackets = async ({
    decryptedToken,
    sessionKey,
    encryptionKey,
    signingKey,
    signatureContextValue,
}: {
    decryptedToken: string;
    sessionKey: SessionKey;
    encryptionKey: PublicKeyReference;
    signingKey: PrivateKeyReference;
    signatureContextValue: string;
}): Promise<{ TokenKeyPacket: string; TokenSignaturePacket: string }> => {
    // Generate the token key packet - sessionKey encrypted with the publicUserKey
    const TokenKeyPacket = (
        await CryptoProxy.encryptSessionKey({
            ...sessionKey,
            encryptionKeys: [encryptionKey],
            format: 'binary',
        })
    ).toBase64();

    // Re-sign the decrypted token with the private user key
    const TokenSignaturePacket = await CryptoProxy.signMessage({
        textData: decryptedToken,
        signingKeys: [signingKey],
        detached: true,
        signatureContext: {
            critical: true,
            value: signatureContextValue,
        },
    });

    return {
        TokenKeyPacket,
        TokenSignaturePacket,
    };
};
