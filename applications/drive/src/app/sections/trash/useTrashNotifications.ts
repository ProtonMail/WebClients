import { c, msgid } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';

import { showAggregatedErrorNotification } from '../../utils/errorHandling/errorNotifications';
import { getEllipsedName } from '../../utils/intl/getEllipsedName';
import { useListNotifications } from '../../utils/useListNotifications';

export const useTrashNotifications = () => {
    const { createSuccessMessage } = useListNotifications();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { createNotification } = useNotifications();

    const createTrashedItemsNotifications = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[],
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => c('Notification').t`"${name}" moved to trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item moved to trash`,
                    `${numberOfItems} items moved to trash`,
                    numberOfItems
                ),
            undoAction
        );

        showAggregatedErrorNotification(
            Object.values(failureItems),
            () => c('Notification').t`"${name}" failed to be moved to trash`,
            () => {
                const numberOfItems = failureItems.length;
                return c('Notification').ngettext(
                    msgid`${numberOfItems} item failed to be moved to trash`,
                    `${numberOfItems} items failed to be moved to trash`,
                    numberOfItems
                );
            }
        );
    };

    const createTrashRestoreNotification = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[],
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => {
                const ellipsedName = getEllipsedName(name);
                return c('Notification').t`"${ellipsedName}" restored from trash`;
            },
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item restored from trash`,
                    `${numberOfItems} items restored from trash`,
                    numberOfItems
                ),
            undoAction
        );

        showAggregatedErrorNotification(
            Object.values(failureItems),
            (error) => error.error,
            () => `${failureItems.length} items failed to be restored from trash`
        );
    };

    const createTrashDeleteNotification = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[]
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => {
                const ellipsedName = getEllipsedName(name);
                return c('Notification').t`"${ellipsedName}" deleted permanently from trash`;
            },
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item deleted permanently from trash`,
                    `${numberOfItems} items deleted permanently from trash`,
                    numberOfItems
                )
        );

        showAggregatedErrorNotification(
            Object.values(failureItems),
            (error) => error.error,
            () => `${failureItems.length} items failed to be deleted from trash`
        );
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
        const notificationText = c('Notification').t`All items deleted permanently from trash`;
        createNotification({ text: notificationText });
    };

    return {
        createTrashedItemsNotifications,
        createTrashRestoreNotification,
        createTrashDeleteNotification,
        createDeleteConfirmModal,
        createEmptyTrashConfirmModal,
        createEmptyTrashNotificationSuccess,
        confirmModal,
    };
};
