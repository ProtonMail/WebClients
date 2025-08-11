import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive/index';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';

export const useSharedWithMeActions = () => {
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const { drive } = useDrive();

    const removeMe = (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        uid: string,
        onRemoved?: (uid: string) => void
    ) => {
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
            onSubmit: async () => {
                try {
                    await drive.leaveSharedNode(uid);
                    createNotification({
                        text: c('Notification').t`File removed`,
                    });
                    onRemoved?.(uid);
                } catch (e) {
                    handleError(e, { fallbackMessage: c('Notification').t`Failed to remove the file` });
                    throw e;
                }
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return {
        removeMe,
    };
};
