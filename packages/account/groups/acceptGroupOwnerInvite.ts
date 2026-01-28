import type { ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { CryptoProxy, VERIFICATION_STATUS, serverTime } from '@proton/crypto';
import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import {
    type AcceptGroupOwnerInviteParameters,
    acceptGroupOwnerInvite as acceptGroupOwnerInviteApi,
} from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import type { Api, DecryptedKey, GroupOwnerInvite } from '@proton/shared/lib/interfaces';
import { decryptKeyPacket } from '@proton/shared/lib/keys/keypacket';

import type { AddressesState } from '../addresses';
import type { GroupsState } from '../groups';
import { groupThunk } from '../groups';
import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import type { UserKeysState } from '../userKeys';
import { userKeysThunk } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & GroupsState & KtState;

interface ReEncryptGroupAddressKeySessionKeyArguments {
    decryptedToken: string;
    privateUserKey: PrivateKeyReference;
}

const reEncryptGroupAddressKeySessionKey = async ({
    decryptedToken,
    privateUserKey,
}: ReEncryptGroupAddressKeySessionKeyArguments) => {
    const date = serverTime(); // ensure the signed message and the encrypted one have the same creation time

    const signature = await CryptoProxy.signMessage({
        textData: decryptedToken,
        date,
        signingKeys: [privateUserKey],
        detached: true,
        signatureContext: {
            critical: true,
            value: 'account.key-token.address',
        },
    });

    const { message: encryptedToken } = await CryptoProxy.encryptMessage({
        textData: decryptedToken,
        date,
        encryptionKeys: [privateUserKey],
    });

    // as a sanity check to detect rare issues like WebCrypto bugs, ensure the token can be decrypted
    await CryptoProxy.decryptMessage({
        armoredMessage: encryptedToken,
        decryptionKeys: privateUserKey,
    }).catch(() => {
        throw new Error('Unexpected key token encryption issue');
    });

    return {
        encryptedToken,
        signature,
    };
};

interface DecryptAndVerifyTokenArguments {
    token: string;
    tokenSignaturePacket: string;
    addressPrivateKeys: PrivateKeyReference[];
    groupPublicKeys: PublicKeyReference[];
}

const decryptAndVerifyGroupToken = async ({
    token,
    tokenSignaturePacket,
    addressPrivateKeys,
    groupPublicKeys,
}: DecryptAndVerifyTokenArguments): Promise<{ decryptedToken: string; sessionKey: SessionKey }> => {
    const { sessionKey } = await decryptKeyPacket({
        armoredMessage: token,
        decryptionKeys: addressPrivateKeys,
    });

    const { data: decryptedToken, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage: token,
        armoredSignature: tokenSignaturePacket,
        sessionKeys: [sessionKey],
        verificationKeys: groupPublicKeys,
        signatureContext: { value: 'account.key-token.group-owner-invite', required: true },
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Token signature verification failed');
        error.name = 'SignatureError';
        throw error;
    }

    return { decryptedToken, sessionKey };
};

interface AcceptGroupOwnerInviteKeys {
    privateUserKey: PrivateKeyReference;
    publicUserKey: PublicKeyReference;
    privateDecryptionKeys: PrivateKeyReference[];
    groupAddressPublicKeys: PublicKeyReference[];
}

const getKeys = async ({
    dispatch,
    api,
    encryptionAddressID,
    signatureAddress,
}: {
    dispatch: ThunkDispatch<RequiredState, ProtonThunkArguments, UnknownAction>;
    api: Api;
    encryptionAddressID: string;
    signatureAddress: string;
}): Promise<AcceptGroupOwnerInviteKeys> => {
    const userKeys = await dispatch(userKeysThunk());

    // Get the address keys for the encryption address to get the decryption keys
    const { decryptionKeys: privateDecryptionKeys } = await dispatch(
        getAddressKeysByUsageThunk({
            AddressID: encryptionAddressID,
            withV6SupportForEncryption: false,
            withV6SupportForSigning: false,
        })
    );

    // Get the primary user key for re-encryption
    const primaryUserKey: DecryptedKey<PrivateKeyReference> = userKeys[0];
    if (!primaryUserKey) {
        throw new Error('No primary user key found');
    }
    const { privateKey: privateUserKey, publicKey: publicUserKey } = primaryUserKey;

    // We need KT-verified fresh group address public keys
    const { addressKeys: groupAddressApiKeys } = await getAndVerifyApiKeys({
        api,
        noCache: true,
        email: signatureAddress,
        internalKeysOnly: true,
        ktUserContext: await dispatch(getKTUserContext()),
    });

    if (!groupAddressApiKeys.length) {
        throw new Error('No group address public keys found');
    }

    // Import group address public keys for signature verification
    const groupAddressPublicKeys = await Promise.all(
        groupAddressApiKeys.map(({ armoredKey }) => CryptoProxy.importPublicKey({ armoredKey }))
    );

    return {
        privateUserKey,
        publicUserKey,
        privateDecryptionKeys,
        groupAddressPublicKeys,
    };
};

const getTokenPackets = async ({
    keys,
    token,
    tokenSignaturePacket,
}: {
    keys: AcceptGroupOwnerInviteKeys;
    token: string;
    tokenSignaturePacket: string;
}): Promise<AcceptGroupOwnerInviteParameters> => {
    const { privateUserKey, publicUserKey, privateDecryptionKeys, groupAddressPublicKeys } = keys;

    const { sessionKey, decryptedToken } = await decryptAndVerifyGroupToken({
        token: token,
        tokenSignaturePacket: tokenSignaturePacket,
        addressPrivateKeys: privateDecryptionKeys,
        groupPublicKeys: groupAddressPublicKeys,
    });

    // Generate the token key packet - sessionKey encrypted with the publicUserKey
    const TokenKeyPacket = (
        await CryptoProxy.encryptSessionKey({
            ...sessionKey,
            encryptionKeys: [publicUserKey],
            format: 'binary',
        })
    ).toBase64();

    // Re-sign the decrypted token with the private user key
    const { signature: TokenSignaturePacket } = await reEncryptGroupAddressKeySessionKey({
        decryptedToken,
        privateUserKey,
    });

    return {
        TokenKeyPacket,
        TokenSignaturePacket,
    };
};

export const acceptGroupOwnerInviteThunk = ({
    invite,
}: {
    invite: GroupOwnerInvite;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        // Get keys needed for decryption and (re-)encryption
        const keys = await getKeys({
            dispatch,
            api,
            encryptionAddressID: invite.EncryptionAddressID,
            signatureAddress: invite.SignatureAddress,
        });

        // Generate TokenKeyPacket and TokenSignaturePacket based on those keys and the invite token + signature
        const apiParams = await getTokenPackets({
            keys,
            token: invite.Token,
            tokenSignaturePacket: invite.TokenSignaturePacket,
        });

        // Call the API to accept the invite, with the generated TokenKeyPacket and TokenSignaturePacket
        await api(acceptGroupOwnerInviteApi(invite.GroupOwnerInviteID, apiParams));

        // Refetch the groups to get the updated address keys with the new token
        await dispatch(groupThunk({ cache: CacheType.None }));
    };
};
