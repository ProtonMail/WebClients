import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import type { useConfirmActionModal } from '@proton/components/index';

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
        preloadLink: boolean = true
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
                sendErrorReport(error);
                createNotification({
                    type: 'error',
                    text: error.message,
                });
                invitationsState.setInvitations([{ ...invitation, isLocked: false }]);
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

        return {
            shareId: invitation.share.shareId,
            linkId: invitation.link.linkId,
            volumeId: invitation.share.volumeId,
        };
    };

    const handleRejectInvitation = async (
        abortSignal: AbortSignal,
        {
            showConfirmModal,
            invitationId,
        }: {
            showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
            invitationId: string;
        }
    ) => {
        showConfirmModal({
            title: c('Title')
                .t`You are about to decline the invitation for the shared item. You will not be able to access it again until the owner shares it with you.`,
            message: c('Info').t`Are you sure you want to proceed?`,
            submitText: c('Action').t`Confirm`,
            onSubmit: async () => {
                // When rejecting an invitation, we can optimistically remove it, and if any issue occurs, we add it back.
                const invitation = await getInvitation(abortSignal, invitationId);
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
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return {
        acceptInvitation: handleAcceptInvitation,
        rejectInvitation: handleRejectInvitation,
    };
};
