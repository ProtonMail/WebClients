import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { sendErrorReport } from '.';
import { EnrichedError } from './EnrichedError';

type HandleErrorOptions = {
    fallbackMessage?: string;
    extra?: {};
    showNotification?: boolean;
};

export const handleLegacyError = (
    error: Error | unknown,
    { fallbackMessage = '', extra = {} }: HandleErrorOptions = {}
) => {
    const errorToHandle = error instanceof Error ? error : new Error(fallbackMessage);

    console.error(errorToHandle);
    const enrichedError = new EnrichedError(errorToHandle.message, {
        tags: {
            component: 'drive-legacy',
        },
        extra: {
            fallbackMessage,
            ...extra,
        },
    });
    enrichedError.name = errorToHandle.name;
    enrichedError.stack = errorToHandle.stack;
    enrichedError.cause = errorToHandle.cause;

    sendErrorReport(enrichedError);

    return errorToHandle;
};

export const useLegacyErrorHandler = () => {
    const { createNotification } = useNotifications();

    const handleError = useCallback(
        (
            error: Error | unknown,
            {
                fallbackMessage = c('Error').t`An error occurred`,
                extra = {},
                showNotification = true,
            }: HandleErrorOptions = {}
        ) => {
            const errorToHandle = handleLegacyError(error, { fallbackMessage, extra });

            if (showNotification) {
                createNotification({ type: 'error', text: errorToHandle.message, preWrap: true });
            }
        },
        [createNotification]
    );

    return {
        handleError,
    };
};
