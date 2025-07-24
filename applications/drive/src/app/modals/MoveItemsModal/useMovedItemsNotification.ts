import { c, msgid } from 'ttag';

import { useErrorHandler } from '../../store/_utils';
import { useListNotifications } from '../../utils/useListNotifications';

export const useMovedItemsNotification = () => {
    const { createSuccessMessage } = useListNotifications();
    const { showAggregatedErrorNotification } = useErrorHandler();

    const createMovedItemsNotifications = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[],
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

        showAggregatedErrorNotification(Object.values(failureItems), (errors) => {
            return errors.length === 1 ? errors[0].error : `${failureItems.length} items failed to be moved`;
        });
    };

    return {
        createMovedItemsNotifications,
    };
};
