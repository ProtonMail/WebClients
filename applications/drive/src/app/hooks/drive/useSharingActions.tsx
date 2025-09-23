import { c } from 'ttag';

import { type useConfirmActionModal, useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

export const useSharingActions = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const stopSharing = (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        uid: string,
        parentUid: string | undefined
    ) => {
        const onSubmit = async () => {
            try {
                await drive.unshareNode(uid);
                await getActionEventManager().emit({
                    type: ActionEventName.UPDATED_NODES,
                    items: [{ uid, parentUid, isShared: false }],
                });

                createNotification({
                    text: c('Notification').t`You stopped sharing this item`,
                });
            } catch (e) {
                handleError(e, { fallbackMessage: c('Notification').t`Stopping the sharing of this item has failed` });
            }
        };
        showConfirmModal({
            title: c('Title').t`Stop sharing?`,
            submitText: c('Title').t`Stop sharing`,
            message: c('Info').t`This action will delete the link and revoke access for all users.`,
            onSubmit,
        });
    };

    const removeMe = (showConfirmModal: ReturnType<typeof useConfirmActionModal>[1], uid: string) => {
        const onSubmit = async () => {
            try {
                await drive.leaveSharedNode(uid);
                createNotification({
                    text: c('Notification').t`File removed`,
                });
                await getActionEventManager().emit({
                    type: ActionEventName.REMOVE_ME,
                    uids: [uid],
                });
            } catch (e) {
                handleError(e, { fallbackMessage: c('Notification').t`Failed to remove the file` });
                throw e;
            }
        };
        showConfirmModal({
            title: c('Title').t`Confirmation required`,
            message: (
                <>
                    <p>
                        {c('Info')
                            .t`You are about to leave the shared item. You will not be able to access it again until the owner shares it with you.`}
                    </p>
                    <p className="mb-0">{c('Info').t`Are you sure you want to proceed?`}</p>
                </>
            ),
            submitText: c('Action').t`Leave`,
            onSubmit,
            canUndo: true, // Just to hide the undo message
        });
    };

    return { stopSharing, removeMe };
};
