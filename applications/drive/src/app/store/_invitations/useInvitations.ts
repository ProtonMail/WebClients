import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import type { PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
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
import { DRIVE_SIGNATURE_CONTEXT, SHARE_EXTERNAL_INVITATION_STATE } from '@proton/shared/lib/drive/constants';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type {
    ShareExternalInvitationPayload,
    ShareInvitationDetailsPayload,
    ShareInvitationPayload,
} from '@proton/shared/lib/interfaces/drive/invitation';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import useFlag from '@proton/unleash/useFlag';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import {
    shareExternalInvitationPayloadToShareExternalInvitation,
    shareInvitationDetailsPayloadToShareInvitationDetails,
    shareInvitationPayloadToShareInvitation,
    useDebouncedRequest,
} from '../_api';
import { useDriveCrypto } from '../_crypto';
import { getOwnAddressKeysWithEmailAsync } from '../_crypto/driveCrypto';
import { useLink } from '../_links';
import { useUserSettings } from '../_settings';
import {
    type ShareInvitationDetails,
    type ShareInvitationEmailDetails,
    useDefaultShare,
    useDriveSharingFlags,
    useShare,
} from '../_shares';
import { useInvitationsState } from './useInvitationsState';

export enum EXTERNAL_INVITATIONS_ERROR_NAMES {
    NOT_FOUND = 'ExternalInvitationsNotFound',
    DISABLED = 'ExternalInvitationsDisabled',
}

export const useInvitations = () => {
    const debouncedRequest = useDebouncedRequest();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const photosWithAlbumsForNewVolume = useFlag('DriveAlbumsNewVolumes');
    const driveCrypto = useDriveCrypto();
    const { isSharingExternalInviteDisabled } = useDriveSharingFlags();
    const { getShareCreatorKeys, getShareSessionKey } = useShare();
    const { getLink, getLinkPrivateKey } = useLink();
    const invitationsState = useInvitationsState();
    const { photosWithAlbumsEnabled } = useUserSettings();
    const { getDefaultPhotosShare } = useDefaultShare();

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
                    KeyPacket: uint8ArrayToBase64String(keyPacket),
                    KeyPacketSignature: uint8ArrayToBase64String(keyPacketSignature),
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
            textData: inviteeEmail.concat('|', uint8ArrayToBase64String(sessionKey.data)),
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
                    ExternalInvitationSignature: uint8ArrayToBase64String(externalInvitationSignature),
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

    const getInvitationDetails = async (
        abortSignal: AbortSignal,
        params: {
            invitationId: string;
            volumeId: string;
            linkId: string;
        }
    ) => {
        const invitationDetails = await debouncedRequest<
            {
                Code: number;
            } & ShareInvitationDetailsPayload
        >(queryInvitationDetails(params.invitationId), abortSignal).then(({ Invitation, Share, Link }) =>
            shareInvitationDetailsPayloadToShareInvitationDetails({
                Invitation,
                Share,
                Link,
            })
        );
        // TODO: Remove that after full rollout of photos
        // We return if customer will NOT have new album experience
        const volumeType = await getDefaultPhotosShare().then((photosShare) => photosShare?.volumeType);

        const willHaveAlbum =
            photosWithAlbumsEnabled ||
            (!photosWithAlbumsEnabled && volumeType === VolumeType.Photos) ||
            (photosWithAlbumsForNewVolume && volumeType === undefined);
        if (invitationDetails?.link.type === LinkType.ALBUM && !willHaveAlbum) {
            return invitationDetails;
        }
        invitationsState.setInvitations([invitationDetails]);
        return invitationDetails;
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
            data: base64StringToUint8Array(invitation.keyPacket),
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
                SessionKeySignature: uint8ArrayToBase64String(sessionKeySignature),
            }),
            abortSignal
        );
    };

    const rejectInvitation = async (abortSignal: AbortSignal, invitationId: string) => {
        return debouncedRequest<{ Code: number }>(queryRejectShareInvite(invitationId), abortSignal);
    };

    const convertExternalInvitation = async (
        abortSignal: AbortSignal,
        {
            linkId,
            contextShareId,
            volumeId,
            externalInvitationId,
        }: {
            linkId: string;
            contextShareId: string;
            volumeId: string;
            externalInvitationId: string;
        }
    ) => {
        if (isSharingExternalInviteDisabled) {
            const error = new EnrichedError(
                c('Error').t`External invitations are temporarily disabled. Please try again later`
            );
            error.name = EXTERNAL_INVITATIONS_ERROR_NAMES.DISABLED;
            throw error;
        }

        // TODO: Using default share will not work for invitations to items
        // from other shares (Photos / Devices).
        // https://jira.protontech.ch/browse/DRVWEB-4257
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
            const error = new EnrichedError(c('Error').t`The invitation doesn't exist anymore`);
            error.name = EXTERNAL_INVITATIONS_ERROR_NAMES.NOT_FOUND;
            throw error;
        }

        if (currentExternalInvitation.state !== SHARE_EXTERNAL_INVITATION_STATE.USER_REGISTERED) {
            throw new Error(c('Error').t`The invitation cannot be completed yet. Please try again later.`);
        }
        const inviterAddressKey = await getShareCreatorKeys(abortSignal, contextShareId);
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

        const linkPrivateKey = await getLinkPrivateKey(abortSignal, contextShareId, linkId);
        const sessionKey = await getShareSessionKey(abortSignal, link.shareId, linkPrivateKey);
        const { verificationStatus, errors } = await CryptoProxy.verifyMessage({
            textData: currentExternalInvitation.inviteeEmail.concat('|', uint8ArrayToBase64String(sessionKey.data)),
            verificationKeys: inviterAddressKey.publicKey,
            binarySignature: base64StringToUint8Array(currentExternalInvitation.externalInvitationSignature),
            signatureContext: { required: true, value: DRIVE_SIGNATURE_CONTEXT.SHARE_MEMBER_EXTERNAL_INVITATION },
        });

        if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            throw new EnrichedError('Failed to validate the signature', {
                tags: {
                    linkId: linkId,
                    shareId: link.shareId,
                    volumeId,
                    externalInvitationId,
                },
                extra: {
                    e: errors,
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
                inviterEmail: inviterAddressKey.address.Email,
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
        decryptInvitationLinkName,
        getInvitationDetails,
        convertExternalInvitation,
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
