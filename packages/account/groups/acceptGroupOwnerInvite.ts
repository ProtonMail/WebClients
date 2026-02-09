import type { ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import type { SessionKey } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { acceptGroupOwnerInvite as acceptGroupOwnerInviteApi } from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import type { Api, GroupOwnerInvite } from '@proton/shared/lib/interfaces';
import { encryptGroupOwnerTokenPackets } from '@proton/shared/lib/keys/groupKeys';

import type { AddressesState } from '../addresses';
import type { GroupsState } from '../groups';
import { groupThunk } from '../groups';
import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import type { UserKeysState } from '../userKeys';
import { userKeysThunk } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & GroupsState & KtState;

const decryptTokenAndSessionKey = async ({
    dispatch,
    api,
    encryptionAddressID,
    signatureAddress,
    token,
    tokenSignaturePacket,
}: {
    dispatch: ThunkDispatch<RequiredState, ProtonThunkArguments, UnknownAction>;
    api: Api;
    encryptionAddressID: string;
    signatureAddress: string;
    token: string;
    tokenSignaturePacket: string;
}): Promise<{ decryptedToken: string; sessionKey: SessionKey }> => {
    // Get the address keys for the encryption address to get the decryption keys
    const { decryptionKeys: privateDecryptionKeys } = await dispatch(
        getAddressKeysByUsageThunk({
            AddressID: encryptionAddressID,
            withV6SupportForEncryption: false,
            withV6SupportForSigning: false,
        })
    );

    // We need KT-verified fresh group address public keys
    const groupAddressPublicKeys = (
        await getAndVerifyApiKeys({
            api,
            noCache: true,
            email: signatureAddress,
            internalKeysOnly: true,
            ktUserContext: await dispatch(getKTUserContext()),
        })
    ).addressKeys.map(({ publicKey }) => publicKey);

    if (!groupAddressPublicKeys.length) {
        throw new Error('No group address public keys found');
    }

    const sessionKey = await CryptoProxy.decryptSessionKey({
        armoredMessage: token,
        decryptionKeys: privateDecryptionKeys,
    });

    if (!sessionKey) {
        throw new Error('Missing session key');
    }

    const { data: decryptedToken, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage: token,
        armoredSignature: tokenSignaturePacket,
        sessionKeys: [sessionKey],
        verificationKeys: groupAddressPublicKeys,
        signatureContext: { value: 'account.key-token.group-owner-invite', required: true },
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error('Token signature verification failed');
        error.name = 'SignatureError';
        throw error;
    }

    return {
        decryptedToken,
        sessionKey,
    };
};

export const acceptGroupOwnerInviteThunk = ({
    invite,
}: {
    invite: GroupOwnerInvite;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const { decryptedToken, sessionKey } = await decryptTokenAndSessionKey({
            dispatch,
            api,
            encryptionAddressID: invite.EncryptionAddressID,
            signatureAddress: invite.SignatureAddress,
            token: invite.Token,
            tokenSignaturePacket: invite.TokenSignaturePacket,
        });

        // Get the primary user key for re-encryption
        const userKeys = await dispatch(userKeysThunk());
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            throw new Error('No primary user key found');
        }

        // Generate TokenKeyPacket and TokenSignaturePacket based on those keys and the invite token + signature
        const apiParams = await encryptGroupOwnerTokenPackets({
            decryptedToken,
            sessionKey,
            encryptionKey: primaryUserKey.publicKey,
            signingKey: primaryUserKey.privateKey,
            signatureContextValue: 'account.key-token.address',
        });

        // Call the API to accept the invite, with the generated TokenKeyPacket and TokenSignaturePacket
        await api(acceptGroupOwnerInviteApi(invite.GroupOwnerInviteID, apiParams));

        // Refetch the groups to get the updated address keys with the new token
        await dispatch(groupThunk({ cache: CacheType.None }));
    };
};
