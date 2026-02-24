import { type ReactNode, useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { NodeType, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

interface UseInvitationsActions {
    setVolumeShareIds?: (volumeId: string, shareIds: string[]) => void;
}

export const useInvitationsActions = ({ setVolumeShareIds }: UseInvitationsActions) => {
    const { createNotification } = useNotifications();

    // useCallback is needed as this can be called inside useEffect, like accepting an invite on page load
    const handleAcceptInvitation = useCallback(
        async (uid: string, invitationUid: string, type: NodeType) => {
            const drive = getDrivePerNodeType(type);
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
                const { volumeId } = splitNodeUid(uid);

                // TODO: Remove setVolumeShareIds when we will have sdk for upload
                if (setVolumeShareIds) {
                    setVolumeShareIds(volumeId, [shareId]);
                }

                await getBusDriver().emit({
                    type: BusDriverEventName.ACCEPT_INVITATIONS,
                    uids: [node.uid],
                });

                createNotification({
                    type: 'success',
                    text: c('Notification').t`Share invitation accepted successfully`,
                });
            } catch (e) {
                handleSdkError(e, { fallbackMessage: c('Notification').t`Failed to accept share invitation` });
            }
        },
        [createNotification, setVolumeShareIds]
    );

    const rejectInvitationInternal = async (uid: string, invitationUid: string, type: NodeType) => {
        const drive = getDrivePerNodeType(type);
        try {
            await drive.rejectInvitation(invitationUid);

            await getBusDriver().emit({
                type: BusDriverEventName.REJECT_INVITATIONS,
                uids: [uid],
            });

            createNotification({
                type: 'success',
                text: c('Notification').t`Share invitation declined`,
            });
        } catch (e) {
            handleSdkError(e, { fallbackMessage: c('Notification').t`Failed to reject share invitation` });
        }
    };

    const handleRejectInvitation = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        {
            uid,
            invitationUid,
            name,
            type,
        }: {
            uid: string;
            invitationUid: string;
            name: string;
            type: NodeType;
        }
    ) => {
        let message: ReactNode;

        // Casting here is necessary to prevent eslint warning bellow.
        // TODO: Investigate why we need that thing
        const invitationName = (<strong key="eslint-autofix-947A46">{`${name}`}</strong>) as ReactNode;

        switch (type) {
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
            onSubmit: () => rejectInvitationInternal(uid, invitationUid, type),
            canUndo: true,
        });
    };

    return {
        acceptInvitation: handleAcceptInvitation,
        rejectInvitation: handleRejectInvitation,
    };
};
