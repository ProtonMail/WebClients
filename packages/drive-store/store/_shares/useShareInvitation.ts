import { c } from 'ttag';

import { useGetAddressKeys, useGetAddresses } from '@proton/components';
import { CryptoProxy, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import {
    queryAcceptShareInvite,
    queryDeleteExternalInvitation,
    queryDeleteInvitation,
    queryExternalInvitationList,
    queryInvitationDetails,
    queryInvitationList,
    queryInviteExternalUser,
    queryInviteProtonUser,
    queryResendInvitation,
    queryShareInvitationDetails,
    queryShareInvitationsListing,
    queryUpdateExternalInvitationPermissions,
    queryUpdateInvitationPermissions,
} from '@proton/shared/lib/api/drive/invitation';
import {
    DRIVE_SIGNATURE_CONTEXT,
    SHARE_EXTERNAL_INVITATION_STATE,
    SHARE_MEMBER_PERMISSIONS,
} from '@proton/shared/lib/drive/constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import {
    ShareExternalInvitationPayload,
    ShareInvitationLinkPayload,
    ShareInvitationListingPayload,
    ShareInvitationPayload,
    ShareInvitationSharePayload,
} from '@proton/shared/lib/interfaces/drive/invitation';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import {
    shareExternalInvitationPayloadToShareExternalInvitation,
    shareInvitationPayloadToShareInvitation,
    useDebouncedRequest,
} from '../_api';
import { useDriveCrypto } from '../_crypto';
import { getOwnAddressKeysWithEmailAsync } from '../_crypto/driveCrypto';
import { useLink } from '../_links';
import useDefaultShare from './useDefaultShare';
import { useDriveSharingFlags } from './useDriveSharingFlags';
import useShare from './useShare';

export const useShareInvitation = () => {
    const debouncedRequest = useDebouncedRequest();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const driveCrypto = useDriveCrypto();
    const { isSharingExternalInviteDisabled } = useDriveSharingFlags();
    const { getShareCreatorKeys, getShareSessionKey } = useShare();
    const { getLink, getLinkPrivateKey } = useLink();
    const { getDefaultShare } = useDefaultShare();

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
            externalInvitationId,
        }: {
            share: {
                shareId: string;
                sessionKey: SessionKey;
            };
            invitee: { inviteeEmail: string; publicKey: PublicKeyReference };
            inviter: { inviterEmail: string; addressKey: PrivateKeyReference };
            permissions: SHARE_MEMBER_PERMISSIONS;
            externalInvitationId?: string;
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
                ExternalInvitationID: externalInvitationId,
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
            linkId,
            inviteeEmail,
            inviter,
            permissions,
        }: {
            shareId: string;
            linkId: string;
            inviteeEmail: string;
            inviter: { inviterEmail: string; addressKey: PrivateKeyReference; addressId: string };
            permissions: SHARE_MEMBER_PERMISSIONS;
        }
    ) => {
        const link = await getLink(abortSignal, shareId, linkId);

        if (!link.shareId) {
            throw new EnrichedError('Cannot load the share');
        }
        const linkPrivateKey = await getLinkPrivateKey(abortSignal, shareId, linkId);
        const sessionKey = await getShareSessionKey(abortSignal, link.shareId, linkPrivateKey);
        const externalInvitationSignature = await CryptoProxy.signMessage({
            textData: inviteeEmail.concat('|').concat(uint8ArrayToBase64String(sessionKey.data)),
            signingKeys: inviter.addressKey,
            detached: true,
            format: 'binary',
            context: { critical: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_EXTERNAL_INVITATION },
        });

        return debouncedRequest<{ Code: number; ExternalInvitation: ShareExternalInvitationPayload }>(
            queryInviteExternalUser(shareId, {
                InviterAddressID: inviter.addressId,
                InviteeEmail: inviteeEmail,
                Permissions: permissions,
                ExternalInvitationSignature: uint8ArrayToBase64String(externalInvitationSignature),
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
                    const error = new Error(
                        c('Error').t`External invitations are temporarily disabled. Please try again later`
                    );
                    error.name = 'ExternalInvtationsDisabled';
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

    // TODO: Check if everything is working correctly also make error cleaner, parallelise calls
    const convertExternalInvitation = async (
        abortSignal: AbortSignal,
        {
            linkId,
            externalInvitationId,
        }: {
            linkId: string;
            externalInvitationId: string;
        }
    ) => {
        if (isSharingExternalInviteDisabled) {
            const error = new Error(
                c('Error').t`External invitations are temporarily disabled. Please try again later`
            );
            error.name = 'ExternalInvtationsDisabled';
            throw error;
        }
        const { shareId: contextShareId, volumeId } = await getDefaultShare();

        const link = await getLink(abortSignal, contextShareId, linkId);
        if (!link.shareId) {
            throw new EnrichedError('Cannot load the share', {
                tags: {
                    linkId: linkId,
                    volumeId,
                    shareId: link.shareId,
                    externalInvitationId,
                },
            });
        }

        const externalInvitations = await listExternalInvitations(abortSignal, link.shareId);
        const currentExternalInvitation = externalInvitations.find(
            (externalInvitation) => externalInvitation.externalInvitationId === externalInvitationId
        );

        if (!currentExternalInvitation) {
            throw new Error(c('Error').t`The invitation doesn't exist anymore`);
        }

        if (currentExternalInvitation.state !== SHARE_EXTERNAL_INVITATION_STATE.USER_REGISTERED) {
            throw new Error(c('Error').t`The invitation cannot be completed yet. Please try again later.`);
        }
        const inviterAddressKey = await getShareCreatorKeys(abortSignal, link.shareId);
        const inviteePublicKey = await driveCrypto.getVerificationKey(currentExternalInvitation.inviteeEmail);

        if (!inviteePublicKey.length) {
            throw new EnrichedError("Can't retrieve invitee's public key", {
                tags: {
                    linkId: linkId,
                    shareId: link.shareId,
                    volumeId,
                    externalInvitationId,
                },
            });
        }

        const linkPrivateKey = await getLinkPrivateKey(abortSignal, link.shareId, linkId);
        const sessionKey = await getShareSessionKey(abortSignal, link.shareId, linkPrivateKey);
        const { verified } = await CryptoProxy.verifyMessage({
            binaryData: sessionKey.data,
            verificationKeys: inviteePublicKey,
            binarySignature: base64StringToUint8Array(currentExternalInvitation.externalInvitationSignature),
        });

        if (!verified) {
            throw new EnrichedError('Failed to validate the signature', {
                tags: {
                    linkId: linkId,
                    shareId: link.shareId,
                    volumeId,
                    externalInvitationId,
                },
            });
        }
        return inviteProtonUser(abortSignal, {
            share: {
                shareId: link.shareId,
                sessionKey,
            },
            invitee: {
                inviteeEmail: currentExternalInvitation.inviteeEmail,
                publicKey: inviteePublicKey[0],
            },
            inviter: {
                inviterEmail: currentExternalInvitation.inviterEmail,
                addressKey: inviterAddressKey.privateKey,
            },
            permissions: currentExternalInvitation.permissions,
            externalInvitationId: currentExternalInvitation.externalInvitationId,
        });
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
        convertExternalInvitation,
        getShareInvitations,
        inviteProtonUser,
        inviteExternalUser,
        listInvitations,
        listExternalInvitations,
        deleteInvitation,
        acceptInvitation,
        resendInvitationEmail,
        updateInvitationPermissions,
        deleteExternalInvitation,
        updateExternalInvitationPermissions,
    };
};
