import { c, msgid } from 'ttag';

import { useErrorHandler } from '../../store/_utils/errorHandler';
import { useListNotifications } from '../../utils/useListNotifications';

export const useDeleteNotification = () => {
    const { createSuccessMessage } = useListNotifications();
    const { showAggregatedErrorNotification } = useErrorHandler();

    const createDeleteNotification = (
        successItems: { name: string; uid: string }[],
        failureItems: { uid: string; error: string }[]
    ) => {
        createSuccessMessage(
            successItems,
            (name: string) => c('Notification').t`"${name}" deleted permanently`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item deleted permanently`,
                    `${numberOfItems} items deleted permanently`,
                    numberOfItems
                )
        );

        showAggregatedErrorNotification(
            Object.values(failureItems).map((failureItem) => failureItem.error),
            (errors) => {
                const numberOfItems = errors.length;
                return numberOfItems === 1
                    ? errors[0]
                    : c('Notification').ngettext(
                          msgid`${numberOfItems} item failed to be deleted`,
                          `${numberOfItems} items failed to be deleted`,
                          numberOfItems
                      );
            }
        );
    };

    return {
        createDeleteNotification,
    };
};
