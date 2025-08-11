import type { ReactNode } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { NodeType, splitNodeUid, useDrive } from '@proton/drive/index';

import { useSharedInfoBatcher } from '../../sections/sharedWith/legacy/useLegacyDirectSharingInfo';
import { useVolumesState } from '../../store/_volumes';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { legacyTimestampToDate } from '../../utils/sdk/legacyTime';
import { ItemType, useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';

export const useInvitationsActions = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const { loadSharedInfo } = useSharedInfoBatcher();
    const { setVolumeShareIds } = useVolumesState();
    const { getSharedWithMeItemFromStore, removeSharedWithMeItemFromStore, setSharedWithMeItemToStore } =
        useSharedWithMeListingStore(
            useShallow((state) => ({
                getSharedWithMeItemFromStore: state.getSharedWithMeItem,
                removeSharedWithMeItemFromStore: state.removeSharedWithMeItem,
                setSharedWithMeItemToStore: state.setSharedWithMeItem,
            }))
        );

    const handleAcceptInvitation = async (uid: string, invitationUid: string) => {
        try {
            await drive.acceptInvitation(invitationUid);
            const maybeNode = await drive.getNode(uid);
            const { node } = getNodeEntity(maybeNode);
            const shareId = node.deprecatedShareId;
            if (!shareId) {
                throw new EnrichedError('The shared with me node entity is missing deprecatedShareId', {
                    extra: { uid: node.uid },
                });
            }
            const { volumeId, nodeId } = splitNodeUid(uid);
            loadSharedInfo(shareId, (sharedInfo) => {
                if (!sharedInfo) {
                    console.warn(
                        'The shared with me node entity is missing sharing info. It could be race condition and means it is probably not shared anymore.',
                        { uid: node.uid, shareId }
                    );
                    return;
                }
                // TODO: Remove that when we will fully migrate to upload using sdk
                // Basically for upload we need to have the volume inside our volume state
                setVolumeShareIds(volumeId, [shareId]);
                setSharedWithMeItemToStore({
                    nodeUid: uid, // Keep the same UID as the original invitation
                    name: node.name,
                    type: node.type,
                    mediaType: node.mediaType,
                    itemType: ItemType.DIRECT_SHARE,
                    thumbnailId: node.activeRevision?.uid || node.uid,
                    size: node.totalStorageSize,
                    directShare: {
                        sharedOn: legacyTimestampToDate(sharedInfo.sharedOn),
                        sharedBy: sharedInfo.sharedBy,
                    },
                    legacy: {
                        linkId: nodeId,
                        shareId: shareId,
                        volumeId: volumeId,
                    },
                });
            });
            createNotification({
                type: 'success',
                text: c('Notification').t`Share invitation accepted successfully`,
            });
        } catch (e) {
            handleError(e, { fallbackMessage: c('Notification').t`Failed to accept share invitation` });
        }
    };

    const handleRejectInvitation = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        uid: string,
        invitationUid: string
    ) => {
        const sharedWithMeItem = getSharedWithMeItemFromStore(uid);
        if (sharedWithMeItem?.itemType !== ItemType.INVITATION) {
            return;
        }
        const invitationName = sharedWithMeItem.name ? <strong>{`${sharedWithMeItem.name} `}</strong> : '';

        let message: ReactNode;

        switch (sharedWithMeItem.type) {
            case NodeType.Album:
                // translator: the variable is the name of a file/folder/album that the user declines the invitations too
                message = c('Info')
                    .jt`You're about to decline the invitation to join the ${invitationName} album. If you proceed, you won't be able to access it unless the owner invites you again. Are you sure you want to continue?`;
                break;
            case NodeType.Folder:
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
                removeSharedWithMeItemFromStore(uid);
                try {
                    await drive.rejectInvitation(invitationUid);
                    createNotification({
                        type: 'success',
                        text: c('Notification').t`Share invitation declined`,
                    });
                } catch (e) {
                    handleError(e, { fallbackMessage: c('Notification').t`Failed to reject share invitation` });
                    setSharedWithMeItemToStore(sharedWithMeItem);
                }
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return {
        acceptInvitation: handleAcceptInvitation,
        rejectInvitation: handleRejectInvitation,
    };
};
