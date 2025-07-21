import { c } from 'ttag';

import { NotificationButton, useNotifications } from '@proton/components';

import { useErrorHandler } from '../store/_utils';

export function useListNotifications() {
    const { createNotification } = useNotifications();
    const { showAggregatedErrorNotification } = useErrorHandler();

    const createSuccessMessage = (
        items: { name: string; uid: string }[],
        oneItemMessage: (name: string) => string,
        manyItemsMessage: (numberOfItems: number) => string,
        undoAction?: () => Promise<void>
    ) => {
        if (!items.length) {
            return;
        }

        const firstItemName = items[0]?.name;
        const message =
            firstItemName && items.length === 1 ? oneItemMessage(firstItemName) : manyItemsMessage(items.length);

        createNotification({
            type: 'success',
            text: (
                <>
                    <span>{message}</span>
                    {undoAction && (
                        <>
                            <NotificationButton onClick={() => undoAction()}>{c('Action').t`Undo`}</NotificationButton>
                        </>
                    )}
                </>
            ),
        });
    };

    const createFailureMessage = (
        items: { name: string; uid: string }[],
        oneItemMessage: (name: string) => string,
        manyItemsMessage: (numberOfItems: number) => string
    ) => {
        showAggregatedErrorNotification(Object.values(items), (errors) => {
            const firstItemName = items[0].name;
            return firstItemName && errors.length === 1
                ? oneItemMessage(firstItemName)
                : manyItemsMessage(errors.length);
        });
    };

    return {
        createSuccessMessage,
        createFailureMessage,
    };
}
