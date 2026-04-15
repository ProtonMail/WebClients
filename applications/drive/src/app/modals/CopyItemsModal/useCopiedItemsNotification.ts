import { c, msgid } from 'ttag';

import { showAggregatedErrorNotification } from '../../utils/errorHandling/errorNotifications';
import { getEllipsedName } from '../../utils/intl/getEllipsedName';
import { useListNotifications } from '../../utils/useListNotifications';

/**
 * Handles aggregation of success/error notifications for batch copy operations.
 */
export const useCopiedItemsNotification = () => {
    const { createSuccessMessage } = useListNotifications();

    const showCopiedItemsNotifications = (
        copies: { name: string; uid: string }[],
        errors: { error: string }[],
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            copies,
            (name: string) => {
                const ellipsedName = getEllipsedName(name);
                return c('Notification').t`"${ellipsedName}" copied`;
            },
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item copied`,
                    `${numberOfItems} items copied`,
                    numberOfItems
                ),
            undoAction
        );

        showAggregatedErrorNotification(
            Object.values(errors),
            (error) => error.error,
            (errors) =>
                c('Notification').ngettext(
                    msgid`${errors.length} item failed to be copied`,
                    `${errors.length} items failed to be copied`,
                    errors.length
                )
        );
    };

    const showUndoCopyNotification = (deletedCopies: { name: string; uid: string }[], errors: { error: string }[]) => {
        createSuccessMessage(
            deletedCopies,
            (name: string) => {
                const ellipsedName = getEllipsedName(name);
                return c('Notification').t`Copy of "${ellipsedName}" moved to trash`;
            },
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} copied item moved to trash`,
                    `${numberOfItems} copied items moved to trash`,
                    numberOfItems
                )
        );

        showAggregatedErrorNotification(
            Object.values(errors),
            (error) => error.error,
            (errors) =>
                c('Notification').ngettext(
                    msgid`${errors.length} item failed to be trashed`,
                    `${errors.length} items failed to be trashed`,
                    errors.length
                )
        );
    };

    return {
        showCopiedItemsNotifications,
        showUndoCopyNotification,
    };
};
