import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import useNotifications from '@proton/components/hooks/useNotifications';

import type { ValidationError } from '../../../legacy/errorHandling/ValidationError';
import { isValidationError } from '../../../legacy/errorHandling/ValidationError';
import { isIgnoredError, sendErrorReport } from '../../../legacy/errorHandling/sendErrorReport';

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

    const showAggregatedErrorNotification = (errors: unknown[], getMessage: (errors: unknown[]) => ReactNode) => {
        const nonIgnoredErrors = errors.filter((error) => !isIgnoredError(error));
        if (!nonIgnoredErrors.length) {
            return;
        }

        const validationErrors: ValidationError[] = Object.values(
            nonIgnoredErrors.filter(isValidationError).reduce<Record<string, ValidationError>>((acc, error) => {
                if (!acc[error.message]) {
                    acc[error.message] = error;
                }
                return acc;
            }, {})
        );

        validationErrors.forEach((error) => {
            createNotification({
                type: 'error',
                text: error.message,
            });
        });

        const unknownErrors = nonIgnoredErrors.filter((error) => !isValidationError(error));

        if (unknownErrors.length !== 0) {
            createNotification({
                type: 'error',
                text: getMessage(unknownErrors),
            });
        }

        errors.forEach((e) => sendErrorReport(e));
    };

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
