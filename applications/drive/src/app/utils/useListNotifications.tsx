import { useState } from 'react';

import { c } from 'ttag';

import { NotificationButton, useNotifications } from '@proton/components';

import { useErrorHandler } from '../store/_utils';

const SuccessNotificationContent = ({ message, undoAction }: { message: string; undoAction?: () => Promise<void> }) => {
    const [undoClicked, setUndoClicked] = useState(false);
    return (
        <>
            <span>{message}</span>
            {undoAction && (
                <>
                    <NotificationButton
                        disabled={undoClicked}
                        onClick={() => {
                            setUndoClicked(true);
                            void undoAction();
                        }}
                    >{c('Action').t`Undo`}</NotificationButton>
                </>
            )}
        </>
    );
};

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
            text: <SuccessNotificationContent message={message} undoAction={undoAction} />,
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
