import {
    CryptoProxy,
    PrivateKeyReference,
    PublicKeyReference,
    SessionKeyWithoutPlaintextAlgo,
} from '@proton/crypto/lib';
import {
    queryInviteProtonUser,
    queryShareInvitationDetails,
    queryShareInvitationsListing,
    queryUpdateShareInvitationPermissions,
} from '@proton/shared/lib/api/drive/invitation';
import { DRIVE_SIGNATURE_CONTEXT, SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { ShareInvitationListingPayload, ShareInvitationPayload } from '@proton/shared/lib/interfaces/drive/invitation';

import { ShareInvitation } from '.';
import { shareInvitationPayloadToShareInvitation, useDebouncedRequest } from '../_api';

export const useShareInvitation = () => {
    const debouncedRequest = useDebouncedRequest();

    const getShareInvitations = async (
        abortSignal: AbortSignal,
        { volumeId, shareId }: { volumeId: string; shareId: string }
    ) => {
        return debouncedRequest<ShareInvitationListingPayload>(
            queryShareInvitationsListing(volumeId, shareId),
            abortSignal
        )
            .then(({ InvitationIDs }) =>
                debouncedRequest<{ Invitations: ShareInvitationPayload[] }>(
                    queryShareInvitationDetails(volumeId, shareId, {
                        InvitationIDs,
                    }),
                    abortSignal
                )
            )
            .then(({ Invitations }) => Invitations.map(shareInvitationPayloadToShareInvitation));
    };

    const inviteProtonUser = async (
        abortSignal: AbortSignal,
        {
            share: { shareId, sessionKey },
            invitee,
            inviter,
            permissions,
        }: {
            share: {
                shareId: string;
                sessionKey: SessionKeyWithoutPlaintextAlgo;
            };
            invitee: { inviteeEmail: string; publicKey: PublicKeyReference };
            inviter: { inviterEmail: string; addressKey: PrivateKeyReference };
            permissions: SHARE_MEMBER_PERMISSIONS;
        }
    ) => {
        const keyPacket = await CryptoProxy.encryptSessionKey({
            ...sessionKey,
            encryptionKeys: invitee.publicKey,
            format: 'binary',
        });

        const keyPacketSignature = await CryptoProxy.signMessage({
            binaryData: keyPacket,
            signingKeys: inviter.addressKey,
            detached: true,
            format: 'binary',
            context: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_INVITE },
        });

        return debouncedRequest<{ Code: number; Invitation: ShareInvitationPayload }>(
            queryInviteProtonUser(shareId, {
                InviteeEmail: invitee.inviteeEmail,
                InviterEmail: inviter.inviterEmail,
                Permissions: permissions,
                KeyPacket: uint8ArrayToBase64String(keyPacket),
                KeyPacketSignature: uint8ArrayToBase64String(keyPacketSignature),
            }),
            abortSignal
        ).then(({ Invitation }) => shareInvitationPayloadToShareInvitation(Invitation));
    };

    const updateShareInvitationPermissions = (
        abortSignal: AbortSignal,
        { volumeId, shareId, invitations }: { volumeId: string; shareId: string; invitations: ShareInvitation[] }
    ) =>
        debouncedRequest(
            queryUpdateShareInvitationPermissions(volumeId, shareId, {
                Invitations: invitations.map(({ invitationId, permissions }) => ({
                    InvitationID: invitationId,
                    Permissions: permissions,
                })),
            }),
            abortSignal
        );

    return {
        getShareInvitations,
        inviteProtonUser,
        updateShareInvitationPermissions,
    };
};
