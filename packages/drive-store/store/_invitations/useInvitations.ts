import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';
import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import {
    queryAcceptShareInvite,
    queryDeleteExternalInvitation,
    queryDeleteInvitation,
    queryExternalInvitationList,
    queryInvitationDetails,
    queryInvitationList,
    queryInviteExternalUser,
    queryInviteProtonUser,
    queryRejectShareInvite,
    queryResendExternalInvitation,
    queryResendInvitation,
    queryUpdateExternalInvitationPermissions,
    queryUpdateInvitationPermissions,
} from '@proton/shared/lib/api/drive/invitation';
import { DRIVE_SIGNATURE_CONTEXT } from '@proton/shared/lib/drive/constants';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type {
    ShareExternalInvitationPayload,
    ShareInvitationDetailsPayload,
    ShareInvitationPayload,
} from '@proton/shared/lib/interfaces/drive/invitation';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import {
    shareExternalInvitationPayloadToShareExternalInvitation,
    shareInvitationDetailsPayloadToShareInvitationDetails,
    shareInvitationPayloadToShareInvitation,
} from '../_api/transformers';
import useDebouncedRequest from '../_api/useDebouncedRequest';
import { getOwnAddressKeysWithEmailAsync } from '../_crypto/driveCrypto';
import useLink from '../_links/useLink';
import type { ShareInvitationDetails, ShareInvitationEmailDetails } from '../_shares/interface';
import useShare from '../_shares/useShare';
import { useInvitationsState } from './useInvitationsState';

enum EXTERNAL_INVITATIONS_ERROR_NAMES {
    NOT_FOUND = 'ExternalInvitationsNotFound',
    DISABLED = 'ExternalInvitationsDisabled',
}

export const useInvitations = () => {
    const debouncedRequest = useDebouncedRequest();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const { getShareSessionKey } = useShare();
    const { getLink, getLinkPrivateKey } = useLink();
    const invitationsState = useInvitationsState();

    const decryptInvitationLinkName = async (
        invitation: ShareInvitationDetails,
        privateKeys: PrivateKeyReference[]
    ) => {
        try {
            const passphrase = await decryptUnsigned({
                armoredMessage: invitation.share.passphrase,
                privateKey: privateKeys,
            });

            const sharePrivateKey = await CryptoProxy.importPrivateKey({
                passphrase: passphrase,
                armoredKey: invitation.share.shareKey,
            });

            const name = await decryptUnsigned({
                armoredMessage: invitation.link.name,
                privateKey: sharePrivateKey,
            });
            return name;
        } catch (e) {
            const error = new EnrichedError("Failed to decrypt invitation's link name", {
                extra: {
                    e,
                },
                tags: {
                    shareId: invitation.share.shareId,
                    linkId: invitation.link.linkId,
                    volumeId: invitation.share.volumeId,
                    invitationId: invitation.invitation.invitationId,
                },
            });
            sendErrorReport(error);
            return '�';
        }
    };

    // We don't update invitation cache after fetching as invitation will be removed right after in some cases like acceptInvitation
    const getInvitation = async (abortSignal: AbortSignal, invitationId: string) => {
        const cachedInvitation = invitationsState.getInvitation(invitationId);
        if (cachedInvitation) {
            return cachedInvitation;
        }
        const invitation = await debouncedRequest<ShareInvitationDetailsPayload>(
            queryInvitationDetails(invitationId),
            abortSignal
        ).then(shareInvitationDetailsPayloadToShareInvitationDetails);
        return invitation;
    };

    const inviteProtonUser = async (
        abortSignal: AbortSignal,
        {
            share: { shareId, sessionKey },
            invitee,
            inviter,
            permissions,
            externalInvitationId,
            emailDetails,
        }: {
            share: {
                shareId: string;
                sessionKey: SessionKey;
            };
            invitee: { inviteeEmail: string; publicKey: PublicKeyReference };
            inviter: { inviterEmail: string; addressKey: PrivateKeyReference };
            permissions: SHARE_MEMBER_PERMISSIONS;
            externalInvitationId?: string;
            emailDetails?: ShareInvitationEmailDetails;
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
            signatureContext: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_INVITER },
        });

        return debouncedRequest<{ Code: number; Invitation: ShareInvitationPayload }>(
            queryInviteProtonUser(shareId, {
                Invitation: {
                    InviteeEmail: invitee.inviteeEmail,
                    InviterEmail: inviter.inviterEmail,
                    Permissions: permissions,
                    KeyPacket: keyPacket.toBase64(),
                    KeyPacketSignature: keyPacketSignature.toBase64(),
                    ExternalInvitationID: externalInvitationId,
                },
                EmailDetails: emailDetails
                    ? {
                          Message: emailDetails.message,
                          ItemName: emailDetails.itemName,
                      }
                    : undefined,
            }),
            abortSignal
        ).then(({ Invitation, Code }) => ({
            invitation: shareInvitationPayloadToShareInvitation(Invitation),
            code: Code,
        }));
    };

    const inviteExternalUser = async (
        abortSignal: AbortSignal,
        {
            shareId,
            rootShareId,
            linkId,
            inviteeEmail,
            inviter,
            permissions,
            emailDetails,
        }: {
            shareId: string;
            rootShareId: string;
            linkId: string;
            inviteeEmail: string;
            inviter: { inviterEmail: string; addressKey: PrivateKeyReference; addressId: string };
            permissions: SHARE_MEMBER_PERMISSIONS;
            emailDetails?: ShareInvitationEmailDetails;
        }
    ) => {
        const link = await getLink(abortSignal, rootShareId, linkId);

        if (!link.shareId) {
            throw new EnrichedError('Failed to load share for external invite', {
                tags: {
                    linkId,
                    shareId,
                },
            });
        }
        const linkPrivateKey = await getLinkPrivateKey(abortSignal, rootShareId, linkId);
        const sessionKey = await getShareSessionKey(abortSignal, link.shareId, linkPrivateKey);
        const externalInvitationSignature = await CryptoProxy.signMessage({
            textData: inviteeEmail.concat('|', sessionKey.data.toBase64()),
            signingKeys: inviter.addressKey,
            detached: true,
            format: 'binary',
            signatureContext: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_EXTERNAL_INVITATION },
        });

        return debouncedRequest<{ Code: number; ExternalInvitation: ShareExternalInvitationPayload }>(
            queryInviteExternalUser(shareId, {
                ExternalInvitation: {
                    InviterAddressID: inviter.addressId,
                    InviteeEmail: inviteeEmail,
                    Permissions: permissions,
                    ExternalInvitationSignature: externalInvitationSignature.toBase64(),
                },
                EmailDetails: emailDetails
                    ? {
                          Message: emailDetails.message,
                          ItemName: emailDetails.itemName,
                      }
                    : undefined,
            }),
            abortSignal
        )
            .then(({ ExternalInvitation, Code }) => ({
                externalInvitation: shareExternalInvitationPayloadToShareExternalInvitation(ExternalInvitation),
                code: Code,
            }))
            .catch((err) => {
                // See RFC Feature flag handling for more info
                if (
                    err.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY &&
                    err.data?.Code === API_CUSTOM_ERROR_CODES.FEATURE_DISABLED
                ) {
                    const error = new EnrichedError(
                        c('Error').t`External invitations are temporarily disabled. Please try again later`
                    );
                    error.name = EXTERNAL_INVITATIONS_ERROR_NAMES.DISABLED;
                    throw error;
                }
                throw err;
            });
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

    const listExternalInvitations = async (abortSignal: AbortSignal, shareId: string) => {
        return debouncedRequest<{ Code: number; ExternalInvitations: ShareExternalInvitationPayload[] }>(
            queryExternalInvitationList(shareId),
            abortSignal
        )
            .then(({ ExternalInvitations }) =>
                ExternalInvitations.map((ExternalInvitation) =>
                    shareExternalInvitationPayloadToShareExternalInvitation(ExternalInvitation)
                )
            )
            .catch((e) => {
                new EnrichedError('Failed to fetch share external invitations', {
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

    const deleteExternalInvitation = async (
        abortSignal: AbortSignal,
        { shareId, externalInvitationId }: { shareId: string; externalInvitationId: string }
    ) => {
        return debouncedRequest<{ Code: number }>(
            queryDeleteExternalInvitation(shareId, externalInvitationId),
            abortSignal
        );
    };

    const resendInvitationEmail = async (
        abortSignal: AbortSignal,
        { shareId, invitationId }: { shareId: string; invitationId: string }
    ) => {
        return debouncedRequest<{ Code: number }>(queryResendInvitation(shareId, invitationId), abortSignal);
    };

    const resendExternalInvitationEmail = async (
        abortSignal: AbortSignal,
        { shareId, externalInvitationId }: { shareId: string; externalInvitationId: string }
    ) => {
        return debouncedRequest<{ Code: number }>(
            queryResendExternalInvitation(shareId, externalInvitationId),
            abortSignal
        );
    };

    const acceptInvitation = async (abortSignal: AbortSignal, { invitation, share, link }: ShareInvitationDetails) => {
        const keys = await getOwnAddressKeysWithEmailAsync(invitation.inviteeEmail, getAddresses, getAddressKeys);

        if (!keys) {
            throw new EnrichedError('Address key for accepting invitation is not available', {
                tags: {
                    invitationId: invitation.invitationId,
                    shareId: share.shareId,
                    linkId: link.linkId,
                    volumeId: share.volumeId,
                },
            });
        }

        const sessionKey = await getDecryptedSessionKey({
            data: Uint8Array.fromBase64(invitation.keyPacket),
            privateKeys: keys?.privateKeys,
        });

        const sessionKeySignature = await CryptoProxy.signMessage({
            binaryData: sessionKey.data,
            signingKeys: keys?.privateKeys,
            detached: true,
            format: 'binary',
            signatureContext: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_MEMBER },
        });

        return debouncedRequest<{ Code: number }>(
            queryAcceptShareInvite(invitation.invitationId, {
                SessionKeySignature: sessionKeySignature.toBase64(),
            }),
            abortSignal
        );
    };

    const rejectInvitation = async (abortSignal: AbortSignal, invitationId: string) => {
        return debouncedRequest<{ Code: number }>(queryRejectShareInvite(invitationId), abortSignal);
    };

    const updateInvitationPermissions = (
        abortSignal: AbortSignal,
        {
            shareId,
            invitationId,
            permissions,
        }: { shareId: string; invitationId: string; permissions: SHARE_MEMBER_PERMISSIONS }
    ) => debouncedRequest(queryUpdateInvitationPermissions(shareId, invitationId, permissions), abortSignal);

    const updateExternalInvitationPermissions = (
        abortSignal: AbortSignal,
        {
            shareId,
            externalInvitationId,
            permissions,
        }: { shareId: string; externalInvitationId: string; permissions: SHARE_MEMBER_PERMISSIONS }
    ) =>
        debouncedRequest(
            queryUpdateExternalInvitationPermissions(shareId, externalInvitationId, permissions),
            abortSignal
        );

    return {
        decryptInvitationLinkName,
        getInvitation,
        inviteProtonUser,
        inviteExternalUser,
        listInvitations,
        listExternalInvitations,
        deleteInvitation,
        acceptInvitation,
        rejectInvitation,
        resendInvitationEmail,
        resendExternalInvitationEmail,
        updateInvitationPermissions,
        deleteExternalInvitation,
        updateExternalInvitationPermissions,
    };
};
