import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { CryptoProxy } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type InviteGroupOwnerParameters,
    inviteGroupOwner as inviteGroupOwnerApi,
} from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address, ApiKeysConfig } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKey } from '@proton/shared/lib/keys/addressKeys';
import { getGroupAddressKeyPassword, getGroupMemberPublicKeys } from '@proton/shared/lib/keys/groupKeys';
import { decryptKeyPacket } from '@proton/shared/lib/keys/keypacket';
import { getMemberByAddressId } from '@proton/shared/lib/keys/memberHelper';

import type { AddressesState } from '../addresses';
import type { KtState } from '../kt';
import { getMemberAddresses, membersThunk } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import type { UserKeysState } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

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

        const [members, organizationKey] = await Promise.all([
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        const { Address: groupAddress } = group;

        const member = getMemberByAddressId(members, newOwnerAddressID);
        const memberAddresses = member ? await dispatch(getMemberAddresses({ member, retry: true })) : [];
        const newOwnerAddress = memberAddresses.find((address) => address.ID === newOwnerAddressID);

        if (!newOwnerAddress) {
            throw new Error('New owner address not found');
        }

        if (!organizationKey.privateKey) {
            throw new Error('Missing private key');
        }

        const { sessionKey } = await decryptKeyPacket({
            armoredMessage: groupAddress.Keys[0].Token,
            decryptionKeys: [organizationKey.privateKey],
        });

        const groupAddressKeySessionKey = await getGroupAddressKeyPassword(
            groupAddress.Keys,
            organizationKey.privateKey
        );

        if (!groupAddressKeySessionKey) {
            throw new Error('Missing group address key session key');
        }

        const groupAddressKey = await getDecryptedAddressKey(groupAddress.Keys[0], groupAddressKeySessionKey);
        const signingPrivateKey = groupAddressKey.privateKey;

        const email = newOwnerAddress.Email;

        const { forwardeeArmoredPrimaryPublicKey } = await getGroupMemberPublicKeys({
            api,
            memberEmail: email,
            getMemberPublicKeys,
        });

        const encryptionPublicKey = await CryptoProxy.importPublicKey({
            armoredKey: forwardeeArmoredPrimaryPublicKey,
        });

        const TokenKeyPacket = (
            await CryptoProxy.encryptSessionKey({
                ...sessionKey,
                encryptionKeys: [encryptionPublicKey],
                format: 'binary',
            })
        ).toBase64();

        const encryptionAddress = newOwnerAddress.Email;

        const TokenKeySignature = await CryptoProxy.signMessage({
            textData: groupAddressKeySessionKey,
            signingKeys: [signingPrivateKey],
            detached: true,
            signatureContext: { critical: true, value: 'account.key-token.group-owner-invite' },
        });

        const apiParams: InviteGroupOwnerParameters = {
            GroupMemberID: groupMemberID,
            EncryptionAddress: encryptionAddress,
            TokenKeyPacket,
            TokenKeySignature,
        };

        await api(inviteGroupOwnerApi(apiParams));
    };
};
