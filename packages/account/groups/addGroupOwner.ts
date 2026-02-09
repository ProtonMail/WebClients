import type { ThunkAction, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { CryptoProxy } from '@proton/crypto';
import type { SessionKey } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type InviteGroupOwnerParameters,
    addGroupOwner,
    inviteGroupOwner as inviteGroupOwnerApi,
} from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type {
    Address,
    AddressKey,
    Api,
    ApiKeysConfig,
    DecryptedKey,
    EnhancedMember,
} from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKey } from '@proton/shared/lib/keys/addressKeys';
import { getDecryptedUserKeys } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import {
    encryptGroupOwnerTokenPackets,
    getGroupAddressKeyPassword,
    getGroupMemberPublicKeys,
} from '@proton/shared/lib/keys/groupKeys';
import { getMemberByAddressId } from '@proton/shared/lib/keys/memberHelper';

import type { AddressesState } from '../addresses';
import type { KtState } from '../kt';
import { getMemberAddresses, membersThunk } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import type { UserKeysState } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

interface DecryptGroupAddressKeyTokenArguments {
    dispatch: ThunkDispatch<RequiredState, ProtonThunkArguments, UnknownAction>;
    token: string;
    groupAddressKeys: AddressKey[];
}

const decryptGroupAddressKeyToken = async ({
    dispatch,
    token,
    groupAddressKeys,
}: DecryptGroupAddressKeyTokenArguments): Promise<{ decryptedToken: string; sessionKey: SessionKey }> => {
    const organizationKey = await dispatch(organizationKeyThunk());

    if (!organizationKey.privateKey) {
        throw new Error('Missing organization private key');
    }

    const sessionKey = await CryptoProxy.decryptSessionKey({
        armoredMessage: token,
        decryptionKeys: [organizationKey.privateKey],
    });

    if (!sessionKey) {
        throw new Error('Missing session key');
    }

    const decryptedToken = await getGroupAddressKeyPassword(groupAddressKeys, organizationKey.privateKey);

    if (!decryptedToken) {
        throw new Error('Could not decrypt group address key token');
    }

    return { decryptedToken, sessionKey };
};

interface MemberAndUserKeys {
    member: EnhancedMember;
    userKeys: DecryptedKey[];
}

const getMemberAndUserKeys = async ({
    dispatch,
    newOwnerAddressID,
}: {
    dispatch: ThunkDispatch<RequiredState, ProtonThunkArguments, UnknownAction>;
    newOwnerAddressID: string;
}): Promise<MemberAndUserKeys> => {
    const [members, organizationKey] = await Promise.all([dispatch(membersThunk()), dispatch(organizationKeyThunk())]);

    const member = getMemberByAddressId(members, newOwnerAddressID);
    const userKeys =
        member && organizationKey.privateKey ? await getDecryptedUserKeys(member.Keys, '', organizationKey) : [];

    if (!member) {
        throw new Error('Member not found');
    }

    return { member, userKeys };
};

const getInviteApiParams = async ({
    dispatch,
    api,
    getMemberPublicKeys,
    groupMemberID,
    newOwnerAddressID,
    member,
    groupAddress,
    decryptedToken,
    sessionKey,
}: {
    dispatch: ThunkDispatch<RequiredState, ProtonThunkArguments, UnknownAction>;
    api: Api;
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
    groupMemberID: string;
    newOwnerAddressID: string;
    member: EnhancedMember;
    groupAddress: Address;
    decryptedToken: string;
    sessionKey: SessionKey;
}): Promise<InviteGroupOwnerParameters> => {
    const memberAddresses = member ? await dispatch(getMemberAddresses({ member, retry: true })) : [];
    const newOwnerAddress = memberAddresses.find((address) => address.ID === newOwnerAddressID);
    if (!newOwnerAddress) {
        throw new Error('New owner address not found');
    }

    const encryptionAddress = newOwnerAddress.Email;

    const { forwardeeArmoredPrimaryPublicKey } = await getGroupMemberPublicKeys({
        api,
        memberEmail: encryptionAddress,
        getMemberPublicKeys,
    });

    const encryptionPublicKey = await CryptoProxy.importPublicKey({
        armoredKey: forwardeeArmoredPrimaryPublicKey,
    });

    const groupAddressKey = await getDecryptedAddressKey(groupAddress.Keys[0], decryptedToken);
    const signingPrivateKey = groupAddressKey.privateKey;

    const { TokenKeyPacket, TokenSignaturePacket } = await encryptGroupOwnerTokenPackets({
        decryptedToken,
        sessionKey,
        encryptionKey: encryptionPublicKey,
        signingKey: signingPrivateKey,
        signatureContextValue: 'account.key-token.group-owner-invite',
    });

    return {
        GroupMemberID: groupMemberID,
        EncryptionAddress: encryptionAddress,
        TokenKeyPacket,
        TokenSignaturePacket,
    };
};

export const addGroupOwnerThunk = ({
    group,
    groupMemberID,
    newOwnerAddressID, // address of the new group owner
    getMemberPublicKeys,
}: {
    group: { ID: string; Address: Address };
    groupMemberID: string;
    newOwnerAddressID: string;
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const token = group.Address.Keys[0].Token;

        if (!token) {
            throw new Error('Missing token');
        }

        const { sessionKey, decryptedToken } = await decryptGroupAddressKeyToken({
            dispatch,
            token,
            groupAddressKeys: group.Address.Keys,
        });

        const { member, userKeys } = await getMemberAndUserKeys({
            dispatch,
            newOwnerAddressID,
        });

        if (!userKeys.length) {
            // Crypto invite flow if we don't have user keys
            const inviteApiParams = await getInviteApiParams({
                dispatch,
                api,
                getMemberPublicKeys,
                groupMemberID,
                newOwnerAddressID,
                member,
                groupAddress: group.Address,
                decryptedToken,
                sessionKey,
            });
            await api(inviteGroupOwnerApi(inviteApiParams));
            return;
        }

        // Add group owner directly if we have user keys
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            throw new Error('No primary user key found');
        }

        const acceptGroupOwnerInviteApiParams = await encryptGroupOwnerTokenPackets({
            decryptedToken,
            sessionKey,
            encryptionKey: primaryUserKey.publicKey,
            signingKey: primaryUserKey.privateKey,
            signatureContextValue: 'account.key-token.address',
        });

        const addGroupOwnerApiParams = {
            MemberID: member.ID,
            ...acceptGroupOwnerInviteApiParams,
        };

        await api(addGroupOwner(groupMemberID, addGroupOwnerApiParams));
    };
};
