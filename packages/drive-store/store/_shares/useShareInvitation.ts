import { useGetAddressKeys, useGetAddresses } from '@proton/components';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import {
    queryAcceptShareInvite,
    queryDeleteInvitation,
    queryInvitationDetails,
    queryInvitationList,
    queryInviteProtonUser,
    queryShareInvitationDetails,
    queryShareInvitationsListing,
    queryUpdateShareInvitationPermissions,
} from '@proton/shared/lib/api/drive/invitation';
import { DRIVE_SIGNATURE_CONTEXT, SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import {
    ShareInvitationLinkPayload,
    ShareInvitationListingPayload,
    ShareInvitationPayload,
    ShareInvitationSharePayload,
} from '@proton/shared/lib/interfaces/drive/invitation';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { ShareInvitation } from '.';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { shareInvitationPayloadToShareInvitation, useDebouncedRequest } from '../_api';
import { getOwnAddressKeysWithEmailAsync } from '../_crypto/driveCrypto';

export const useShareInvitation = () => {
    const debouncedRequest = useDebouncedRequest();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

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
                sessionKey: SessionKey;
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
            context: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_INVITER },
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

    const listInvitations = async (abortSignal: AbortSignal, shareId: string) => {
        return debouncedRequest<{ Code: number; Invitations: ShareInvitationPayload[] }>(
            queryInvitationList(shareId),
            abortSignal
        )
            .then(({ Invitations }) =>
                Invitations.map((Invitation) => shareInvitationPayloadToShareInvitation(Invitation))
            )
            .catch((e) => {
                new EnrichedError('Failed to fetch share invitations', {
                    tags: {
                        shareId,
                    },
                    extra: { e },
                });
                return [];
            });
    };

    const deleteInvitation = async (
        abortSignal: AbortSignal,
        { shareId, invitationId }: { shareId: string; invitationId: string }
    ) => {
        return debouncedRequest<{ Code: number }>(queryDeleteInvitation(shareId, invitationId), abortSignal);
    };

    const acceptInvitation = async (
        abortSignal: AbortSignal,
        params: {
            invitationId: string;
            volumeId: string;
            linkId: string;
        }
    ) => {
        const invitationDetails = await debouncedRequest<{
            Code: number;
            Invitation: ShareInvitationPayload;
            Share: ShareInvitationSharePayload;
            Link: ShareInvitationLinkPayload;
        }>(queryInvitationDetails(params.invitationId), abortSignal);
        const keys = await getOwnAddressKeysWithEmailAsync(
            invitationDetails.Invitation.InviteeEmail,
            getAddresses,
            getAddressKeys
        );

        if (!keys) {
            throw new EnrichedError('Address key for accepting invitation is not available', {
                tags: params,
            });
        }

        const sessionKey = await getDecryptedSessionKey({
            data: base64StringToUint8Array(invitationDetails.Invitation.KeyPacket),
            privateKeys: keys?.privateKeys,
        });

        const sessionKeySignature = await CryptoProxy.signMessage({
            binaryData: sessionKey.data,
            signingKeys: keys?.privateKeys,
            detached: true,
            format: 'binary',
            context: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_INVITER },
        });

        return debouncedRequest<{ Code: number }>(
            queryAcceptShareInvite(params.invitationId, {
                SessionKeySignature: uint8ArrayToBase64String(sessionKeySignature),
            }),
            abortSignal
        );
    };

    const updateShareInvitationPermissions = (
        abortSignal: AbortSignal,
        { shareId, invitation }: { shareId: string; invitation: ShareInvitation }
    ) =>
        debouncedRequest(
            queryUpdateShareInvitationPermissions(shareId, invitation.invitationId, invitation.permissions),
            abortSignal
        );

    return {
        getShareInvitations,
        inviteProtonUser,
        listInvitations,
        deleteInvitation,
        acceptInvitation,
        updateShareInvitationPermissions,
    };
};
