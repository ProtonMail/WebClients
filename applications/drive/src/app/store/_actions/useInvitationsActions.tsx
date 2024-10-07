import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import type { useConfirmActionModal } from '@proton/components/index';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useInvitations } from '../_invitations';
import { useInvitationsState } from '../_invitations/useInvitationsState';
import { useLink, useLinksListing } from '../_links';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useVolumesState } from '../_volumes';

export const useInvitationsActions = () => {
    const { setVolumeShareIds } = useVolumesState();
    const { getLink } = useLink();
    const { acceptInvitation, rejectInvitation } = useInvitations();
    const { getDirectSharingInfo } = useDirectSharingInfo();
    const { createNotification } = useNotifications();
    const { getInvitation, setInvitations, removeInvitations } = useInvitationsState();
    const linksListing = useLinksListing();

    const handleAcceptInvitation = async (abortSignal: AbortSignal, invitationId: string) => {
        const pendingInvitation = getInvitation(invitationId);
        if (!pendingInvitation) {
            return;
        }
        setInvitations([{ ...pendingInvitation, isLocked: true }]);
        await acceptInvitation(abortSignal, pendingInvitation)
            .then((response) => {
                if (response?.Code !== 1000) {
                    throw new EnrichedError(
                        c('Notification').t`Failed to accept share invitation`,
                        {
                            tags: {
                                volumeId: pendingInvitation.share.volumeId,
                                shareId: pendingInvitation.share.shareId,
                                linkId: pendingInvitation.link.linkId,
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
                setInvitations([{ ...pendingInvitation, isLocked: false }]);
                throw error;
            });

        // Preload link's info
        await Promise.all([
            getLink(abortSignal, pendingInvitation.share.shareId, pendingInvitation.link.linkId),
            getDirectSharingInfo(abortSignal, pendingInvitation.share.shareId),
        ]);

        // TODO: Remove this when we will have events
        linksListing.setSharedWithMeShareIdsState([pendingInvitation.share.shareId]);
        setVolumeShareIds(pendingInvitation.share.volumeId, [pendingInvitation.share.shareId]);

        removeInvitations([pendingInvitation.invitation.invitationId]);
        createNotification({
            type: 'success',
            text: c('Notification').t`Share invitation accepted successfully`,
        });
    };

    const handleRejectInvitation = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        invitationId: string
    ) => {
        showConfirmModal({
            title: c('Title')
                .t`You are about to decline the invitation for the shared item. You will not be able to access it again until the owner shares it with you.`,
            message: c('Info').t`Are you sure you want to proceed?`,
            submitText: c('Action').t`Confirm`,
            onSubmit: async () => {
                // When rejecting an invitation, we can optimistically remove it, and if any issue occurs, we add it back.
                const pendingInvitation = getInvitation(invitationId);
                if (!pendingInvitation) {
                    return;
                }
                removeInvitations([invitationId]);
                await rejectInvitation(new AbortController().signal, invitationId)
                    .then((response) => {
                        if (response?.Code !== 1000) {
                            throw new EnrichedError(
                                c('Notification').t`Failed to reject share invitation`,
                                {
                                    tags: {
                                        volumeId: pendingInvitation.share.volumeId,
                                        shareId: pendingInvitation.share.shareId,
                                        linkId: pendingInvitation.link.linkId,
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
                        if (pendingInvitation) {
                            setInvitations([pendingInvitation]);
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
