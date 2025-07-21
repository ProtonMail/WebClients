import { c, msgid } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';

import { useErrorHandler } from '../../store/_utils';
import { useListNotifications } from '../../utils/useListNotifications';

export const useTrashNotifications = () => {
    const { createSuccessMessage } = useListNotifications();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { showAggregatedErrorNotification } = useErrorHandler();
    const { createNotification } = useNotifications();

    const createTrashRestoreNotification = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[],
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => c('Notification').t`"${name}" restored from trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item restored from trash`,
                    `${numberOfItems} items restored from trash`,
                    numberOfItems
                ),
            undoAction
        );

        showAggregatedErrorNotification(Object.values(failureItems), (errors) => {
            return errors.length === 1
                ? errors[0].error
                : `${failureItems.length} items failed to be restored from trash`;
        });
    };

    const createTrashDeleteNotification = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[]
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => c('Notification').t`"${name}" deleted permanently from trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item deleted permanently from trash`,
                    `${numberOfItems} items deleted permanently from trash`,
                    numberOfItems
                )
        );

        showAggregatedErrorNotification(Object.values(failureItems), (errors) => {
            return errors.length === 1
                ? errors[0].error
                : `${failureItems.length} items failed to be deleted from trash`;
        });
    };

    const createDeleteConfirmModal = (items: { name: string; uid: string }[], onConfirm: () => Promise<unknown>) => {
        const itemName = items[0].name;
        const title = c('Title').t`Delete permanently`;
        const submitText = c('Action').t`Delete permanently`;
        const message =
            items.length === 1 && itemName
                ? c('Info').t`Are you sure you want to permanently delete "${itemName}" from trash?`
                : c('Info').t`Are you sure you want to permanently delete selected items from trash?`;

        return showConfirmModal({ title, submitText, message, onSubmit: onConfirm });
    };

    const createEmptyTrashConfirmModal = (onSubmit: () => Promise<unknown>) => {
        const title = c('Title').t`Empty trash`;
        const submitText = c('Action').t`Empty trash`;
        const message = c('Info').t`Are you sure you want to empty trash and permanently delete all the items?`;

        return showConfirmModal({ title, submitText, message, onSubmit });
    };

    const createEmptyTrashNotificationSuccess = () => {
        const notificationText = c('Notification').t`All items will soon be permanently deleted from trash`;
        createNotification({ text: notificationText });
    };

    return {
        createTrashRestoreNotification,
        createTrashDeleteNotification,
        createDeleteConfirmModal,
        createEmptyTrashConfirmModal,
        createEmptyTrashNotificationSuccess,
        confirmModal,
    };
};
