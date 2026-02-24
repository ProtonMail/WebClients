import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import { splitInvitationUid, useDrive } from '@proton/drive/index';

import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

export const useInvitationsLoader = () => {
    const {
        drive,
        internal: { photos },
    } = useDrive();
    const { createNotification } = useNotifications();

    const { setSharedWithMeItemInStore, setLoadingInvitations, cleanupStaleItems } = useSharedWithMeListingStore(
        useShallow((state) => ({
            setSharedWithMeItemInStore: state.setSharedWithMeItem,
            setLoadingInvitations: state.setLoadingInvitations,
            cleanupStaleItems: state.cleanupStaleItems,
        }))
    );

    const loadInvitations = useCallback(
        async (abortSignal: AbortSignal) => {
            if (useSharedWithMeListingStore.getState().isLoadingInvitations) {
                return;
            }
            setLoadingInvitations(true);
            try {
                let showErrorNotification = false;
                const loadedUids = new Set<string>();

                for await (const invitation of drive.iterateInvitations(abortSignal)) {
                    const name = invitation.node.name.ok ? invitation.node.name.value : invitation.node.name.error.name;
                    const sharedBy = invitation.addedByEmail.ok
                        ? invitation.addedByEmail.value
                        : invitation.addedByEmail.error.claimedAuthor || '';

                    const { shareId } = splitInvitationUid(invitation.uid);

                    try {
                        loadedUids.add(invitation.node.uid);
                        setSharedWithMeItemInStore({
                            nodeUid: invitation.node.uid,
                            name,
                            type: invitation.node.type,
                            mediaType: invitation.node.mediaType,
                            itemType: ItemType.INVITATION,
                            thumbnailId: undefined,
                            size: undefined,
                            invitation: {
                                uid: invitation.uid,
                                sharedBy,
                            },
                            shareId,
                        });
                    } catch (e) {
                        handleSdkError(e, {
                            showNotification: false,
                        });
                        showErrorNotification = true;
                    }
                }

                // TODO: Quick fix, we should combine with logic above
                for await (const invitation of photos.iterateInvitations(abortSignal)) {
                    const name = invitation.node.name.ok ? invitation.node.name.value : invitation.node.name.error.name;
                    const sharedBy = invitation.addedByEmail.ok
                        ? invitation.addedByEmail.value
                        : invitation.addedByEmail.error.claimedAuthor || '';

                    const { shareId } = splitInvitationUid(invitation.uid);

                    try {
                        loadedUids.add(invitation.node.uid);
                        setSharedWithMeItemInStore({
                            nodeUid: invitation.node.uid,
                            name,
                            type: invitation.node.type,
                            mediaType: invitation.node.mediaType,
                            itemType: ItemType.INVITATION,
                            thumbnailId: undefined,
                            size: undefined,
                            invitation: {
                                uid: invitation.uid,
                                sharedBy,
                            },
                            shareId,
                        });
                    } catch (e) {
                        handleSdkError(e, {
                            showNotification: false,
                        });
                        showErrorNotification = true;
                    }
                }

                if (showErrorNotification) {
                    createNotification({
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
        },
        [photos, drive, createNotification, setSharedWithMeItemInStore, setLoadingInvitations, cleanupStaleItems]
    );

    return {
        loadInvitations,
    };
};
