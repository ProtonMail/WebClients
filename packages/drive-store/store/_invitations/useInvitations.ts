import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import {
    queryAcceptShareInvite,
    queryInvitationDetails,
    queryRejectShareInvite,
} from '@proton/shared/lib/api/drive/invitation';
import { DRIVE_SIGNATURE_CONTEXT } from '@proton/shared/lib/drive/constants';
import type { ShareInvitationDetailsPayload } from '@proton/shared/lib/interfaces/drive/invitation';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { shareInvitationDetailsPayloadToShareInvitationDetails } from '../_api/transformers';
import useDebouncedRequest from '../_api/useDebouncedRequest';
import { getOwnAddressKeysWithEmailAsync } from '../_crypto/driveCrypto';
import type { ShareInvitationDetails } from '../_shares/interface';
import { useInvitationsState } from './useInvitationsState';

export const useInvitations = () => {
    const debouncedRequest = useDebouncedRequest();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
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

    return {
        decryptInvitationLinkName,
        getInvitation,
        acceptInvitation,
        rejectInvitation,
    };
};
