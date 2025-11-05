import { c, msgid } from 'ttag';

import { useErrorHandler } from '../../store/_utils';
import { useListNotifications } from '../../utils/useListNotifications';

/**
 * Handles aggregation of success/error notifications for batch copy operations.
 */
export const useCopiedItemsNotification = () => {
    const { createSuccessMessage } = useListNotifications();
    const { showAggregatedErrorNotification } = useErrorHandler();

    const showCopiedItemsNotifications = (
        copies: { name: string; uid: string }[],
        errors: { error: string }[],
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            copies,
            (name: string) => c('Notification').t`"${name}" successfully copied`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item successfully copied`,
                    `${numberOfItems} items successfully copied`,
                    numberOfItems
                ),
            undoAction
        );

        showAggregatedErrorNotification(Object.values(errors), (errors) => {
            return errors.length === 1
                ? errors[0].error
                : c('Notification').ngettext(
                      msgid`${errors.length} item failed to be copied`,
                      `${errors.length} items failed to be copied`,
                      errors.length
                  );
        });
    };

    const showUndoCopyNotification = (deletedCopies: { name: string; uid: string }[], errors: { error: string }[]) => {
        createSuccessMessage(
            deletedCopies,
            (name: string) => c('Notification').t`Copy of "${name}" moved to trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} copied item moved to trash`,
                    `${numberOfItems} copied items moved to trash`,
                    numberOfItems
                )
        );

        showAggregatedErrorNotification(Object.values(errors), (errors) => {
            return errors.length === 1
                ? errors[0].error
                : c('Notification').ngettext(
                      msgid`${errors.length} item failed to be trashed`,
                      `${errors.length} items failed to be trashed`,
                      errors.length
                  );
        });
    };

    return {
        showCopiedItemsNotifications,
        showUndoCopyNotification,
    };
};
