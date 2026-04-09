import { c } from 'ttag';

import { getDrive, getDriveForPhotos, splitInvitationUid } from '@proton/drive/index';

import { getNotificationsManager } from '../../../modules/notifications';
import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { ItemType, useSharedWithMeStore } from '../useSharedWithMe.store';

export const loadInvitations = async (abortSignal: AbortSignal) => {
    const { isLoadingInvitations, setLoadingInvitations, setSharedWithMeItem, cleanupStaleItems } =
        useSharedWithMeStore.getState();
    if (isLoadingInvitations) {
        return;
    }
    setLoadingInvitations(true);
    try {
        let showErrorNotification = false;
        const loadedUids = new Set<string>();

        try {
            for await (const invitation of getDrive().iterateInvitations(abortSignal)) {
                const name = invitation.node.name.ok ? invitation.node.name.value : invitation.node.name.error.name;
                const sharedBy = invitation.addedByEmail.ok
                    ? invitation.addedByEmail.value
                    : invitation.addedByEmail.error.claimedAuthor || '';

                const { shareId } = splitInvitationUid(invitation.uid);

                loadedUids.add(invitation.node.uid);
                setSharedWithMeItem({
                    nodeUid: invitation.node.uid,
                    name,
                    type: invitation.node.type,
                    mediaType: invitation.node.mediaType,
                    itemType: ItemType.INVITATION,
                    activeRevisionUid: undefined,
                    size: undefined,
                    invitation: {
                        uid: invitation.uid,
                        sharedBy,
                    },
                    shareId,
                });
            }
        } catch (e) {
            if (abortSignal.aborted) {
                return;
            }
            handleSdkError(e, {
                showNotification: false,
            });
            showErrorNotification = true;
        }

        // TODO: Quick fix, we should combine with logic above
        try {
            for await (const invitation of getDriveForPhotos().iterateInvitations(abortSignal)) {
                const name = invitation.node.name.ok ? invitation.node.name.value : invitation.node.name.error.name;
                const sharedBy = invitation.addedByEmail.ok
                    ? invitation.addedByEmail.value
                    : invitation.addedByEmail.error.claimedAuthor || '';

                const { shareId } = splitInvitationUid(invitation.uid);

                loadedUids.add(invitation.node.uid);
                setSharedWithMeItem({
                    nodeUid: invitation.node.uid,
                    name,
                    type: invitation.node.type,
                    mediaType: invitation.node.mediaType,
                    itemType: ItemType.INVITATION,
                    activeRevisionUid: undefined,
                    size: undefined,
                    invitation: {
                        uid: invitation.uid,
                        sharedBy,
                    },
                    shareId,
                });
            }
        } catch (e) {
            if (abortSignal.aborted) {
                return;
            }
            handleSdkError(e, {
                showNotification: false,
            });
            showErrorNotification = true;
        }

        if (abortSignal.aborted) {
            return;
        }

        if (showErrorNotification) {
            getNotificationsManager().createNotification({
                type: 'error',
                text: c('Error').t`We were not able to load some invitations`,
            });
        }

        cleanupStaleItems(ItemType.INVITATION, loadedUids);
    } catch (e) {
        handleSdkError(e, {
            fallbackMessage: c('Error').t`We were not able to load some of your invitation to shared items`,
            showNotification: false,
        });
    } finally {
        setLoadingInvitations(false);
    }
};
