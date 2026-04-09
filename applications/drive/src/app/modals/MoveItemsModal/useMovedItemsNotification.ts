import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useListNotifications } from '../../utils/useListNotifications';

export const useMovedItemsNotification = () => {
    const { createSuccessMessage } = useListNotifications();
    const { createNotification } = useNotifications();

    const createMovedItemsNotifications = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: Error }[],
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => c('Notification').t`"${name}" successfully moved`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item successfully moved`,
                    `${numberOfItems} items successfully moved`,
                    numberOfItems
                ),
            undoAction
        );

        if (failureItems.length > 0) {
            const text =
                failureItems.length === 1
                    ? failureItems[0].error.message
                    : c('Error').ngettext(
                          msgid`${failureItems.length} item failed to be moved`,
                          `${failureItems.length} items failed to be moved`,
                          failureItems.length
                      );
            createNotification({ type: 'error', text });
            failureItems.forEach(({ error }) => handleSdkError(error, { showNotification: false }));
        }
    };

    return {
        createMovedItemsNotifications,
    };
};
