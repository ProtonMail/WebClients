import { c, msgid } from 'ttag';

import { showAggregatedErrorNotification } from '../../utils/errorHandling/errorNotifications';
import { useListNotifications } from '../../utils/useListNotifications';

export const usePublicPageNotifications = () => {
    const { createSuccessMessage } = useListNotifications();

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
            (error) => error,
            (errors) =>
                c('Notification').ngettext(
                    msgid`${errors.length} item failed to be deleted`,
                    `${errors.length} items failed to be deleted`,
                    errors.length
                )
        );
    };

    return {
        createDeleteNotification,
    };
};
