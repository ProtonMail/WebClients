import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import { splitInvitationUid, splitNodeUid, useDrive } from '@proton/drive/index';

import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

export const useInvitationsLoader = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const { setSharedWithMeItemInStore, setLoadingInvitations } = useSharedWithMeListingStore(
        useShallow((state) => ({
            setSharedWithMeItemInStore: state.setSharedWithMeItem,
            setLoadingInvitations: state.setLoadingInvitations,
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

                for await (const invitation of drive.iterateInvitations(abortSignal)) {
                    const name = invitation.node.name.ok ? invitation.node.name.value : invitation.node.name.error.name;
                    const sharedBy = invitation.addedByEmail.ok
                        ? invitation.addedByEmail.value
                        : invitation.addedByEmail.error.claimedAuthor || '';

                    const { shareId } = splitInvitationUid(invitation.uid);

                    try {
                        const { volumeId, nodeId } = splitNodeUid(invitation.node.uid);

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
                            legacy: {
                                linkId: nodeId,
                                shareId: shareId,
                                volumeId: volumeId,
                            },
                        });
                    } catch (e) {
                        handleError(e, {
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
            } catch (e) {
                handleError(e, {
                    fallbackMessage: c('Error').t`We were not able to load some of your invitation to shared items`,
                });
            } finally {
                setLoadingInvitations(false);
            }
        },
        [drive, handleError, createNotification, setSharedWithMeItemInStore, setLoadingInvitations]
    );

    return {
        loadInvitations,
    };
};
