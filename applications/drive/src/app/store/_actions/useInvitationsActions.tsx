import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useInvitations } from '../_invitations';
import { useInvitationsState } from '../_invitations/useInvitationsState';
import { useLink, useLinksListing } from '../_links';
import { useVolumesState } from '../_volumes';

export const useInvitationsActions = () => {
    const { setVolumeShareIds } = useVolumesState();
    const { getLink } = useLink();
    const { acceptInvitation, rejectInvitation } = useInvitations();
    const { createNotification } = useNotifications();
    const invitationsState = useInvitationsState();
    const { getInvitation } = useInvitations();
    const linksListing = useLinksListing();

    const handleAcceptInvitation = async (
        abortSignal: AbortSignal,
        invitationId: string,
        preloadLink: boolean = true,
        onSuccess?: (result: { shareId: string; linkId: string; volumeId: string }) => void
    ) => {
        const invitation = await getInvitation(abortSignal, invitationId);
        if (!invitation) {
            return;
        }
        invitationsState.setInvitations([{ ...invitation, isLocked: true }]);
        await acceptInvitation(abortSignal, invitation)
            .then((response) => {
                if (response?.Code !== 1000) {
                    throw new EnrichedError(
                        c('Notification').t`Failed to accept share invitation`,
                        {
                            tags: {
                                volumeId: invitation.share.volumeId,
                                shareId: invitation.share.shareId,
                                linkId: invitation.link.linkId,
                                invitationId,
                            },
                        },
                        'Failed to accept share invitation'
                    );
                }
            })
            .catch((error) => {
                invitationsState.setInvitations([{ ...invitation, isLocked: false }]);
                // Skip sending error if it's expected error
                if (
                    error?.data?.Code === API_CUSTOM_ERROR_CODES.ALREADY_MEMBER_OF_SHARE_IN_VOLUME_WITH_ANOTHER_ADDRESS
                ) {
                    return;
                }
                sendErrorReport(error);
                throw error;
            });

        // TODO: Remove this section with Invitation section refactor
        // Since we want to show the accepted share at the same place in the list we have to set the cache manually and not waiting event to run
        /* --- SECTION-START --- */
        // Due to how cache is done, we do that to prevent multiple call to share bootstrap
        // We only need link's preload in case of accept in the shared with me section
        if (preloadLink) {
            await getLink(abortSignal, invitation.share.shareId, invitation.link.linkId);
        }
        linksListing.setShareIdsState([invitation.share.shareId]);
        setVolumeShareIds(invitation.share.volumeId, [invitation.share.shareId]);
        /* --- SECTION-END --- */

        invitationsState.removeInvitations([invitation.invitation.invitationId]);
        createNotification({
            type: 'success',
            text: c('Notification').t`Share invitation accepted successfully`,
        });

        const result = {
            shareId: invitation.share.shareId,
            linkId: invitation.link.linkId,
            volumeId: invitation.share.volumeId,
        };

        onSuccess?.(result);

        return result;
    };

    const handleRejectInvitation = async (
        abortSignal: AbortSignal,
        {
            showConfirmModal,
            invitationId,
            onSuccess,
        }: {
            showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
            invitationId: string;
            onSuccess?: () => void;
        }
    ) => {
        const invitation = await getInvitation(abortSignal, invitationId);
        const invitationName = invitation.decryptedLinkName ? (
            <strong>{`${invitation.decryptedLinkName} `}</strong>
        ) : (
            ''
        );

        let message: ReactNode;

        switch (invitation.link.type) {
            case LinkType.ALBUM:
                // translator: the variable is the name of a file/folder/album that the user declines the invitations too
                message = c('Info')
                    .jt`You're about to decline the invitation to join the ${invitationName} album. If you proceed, you won't be able to access it unless the owner invites you again. Are you sure you want to continue?`;
                break;
            case LinkType.FOLDER:
                // translator: the variable is the name of a file/folder/album that the user declines the invitations too
                message = c('Info')
                    .jt`You're about to decline the invitation to join the ${invitationName} folder. If you proceed, you won't be able to access it unless the owner invites you again. Are you sure you want to continue?`;
                break;
            default:
                // translator: the variable is the name of a file/folder/album that the user declines the invitations too
                message = c('Info')
                    .jt`You're about to decline the invitation to join the ${invitationName} item. If you proceed, you won't be able to access it unless the owner invites you again. Are you sure you want to continue?`;
        }

        showConfirmModal({
            title: c('Title').t`Decline invitation?`,
            message,
            submitText: c('Action').t`Decline invite`,
            cancelText: c('Action').t`Go back`,
            onSubmit: async () => {
                // When rejecting an invitation, we can optimistically remove it, and if any issue occurs, we add it back.
                if (!invitation) {
                    return;
                }
                invitationsState.removeInvitations([invitationId]);
                await rejectInvitation(new AbortController().signal, invitationId)
                    .then((response) => {
                        if (response?.Code !== 1000) {
                            throw new EnrichedError(
                                c('Notification').t`Failed to reject share invitation`,
                                {
                                    tags: {
                                        volumeId: invitation.share.volumeId,
                                        shareId: invitation.share.shareId,
                                        linkId: invitation.link.linkId,
                                        invitationId,
                                    },
                                },
                                'Failed to reject share invitation'
                            );
                        }
                    })
                    .catch((err) => {
                        createNotification({
                            type: 'error',
                            text: err.message,
                        });
                        // Adding invite back if any issue happened
                        if (invitation) {
                            invitationsState.setInvitations([invitation]);
                        }
                        throw err;
                    });
                createNotification({
                    type: 'success',
                    text: c('Notification').t`Share invitation declined`,
                });

                onSuccess?.();
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return {
        acceptInvitation: handleAcceptInvitation,
        rejectInvitation: handleRejectInvitation,
    };
};
