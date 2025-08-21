import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import {
    AbortError,
    ConnectionError,
    ProtonDriveError,
    RateLimitedError,
    ServerError,
    ValidationError,
} from '@proton/drive';

import { sendErrorReport } from '.';
import { EnrichedError } from './EnrichedError';

export const shouldTrackError = (err: Error) =>
    !(err instanceof ValidationError) &&
    !(err instanceof AbortError) &&
    !(err instanceof RateLimitedError) &&
    !(err instanceof ConnectionError);

export const shouldShowNotification = (err: Error) => !(err instanceof AbortError);

type HandleErrorOptions = {
    fallbackMessage?: string;
    extra?: {};
    showNotification?: boolean;
};

export const handleSdkError = (
    error: Error | unknown,
    { fallbackMessage = '', extra = {} }: HandleErrorOptions = {}
) => {
    const errorToHandle = error instanceof Error ? error : new Error(fallbackMessage);
    const message = error instanceof ProtonDriveError ? errorToHandle.message : fallbackMessage;

    console.error(errorToHandle);
    if (shouldTrackError(errorToHandle)) {
        const enrichedError = new EnrichedError(errorToHandle.message, {
            tags: {
                component: 'drive-sdk',
            },
            extra: {
                fallbackMessage,
                ...(error instanceof ServerError && {
                    serverErrorCode: error.code,
                    serverErrorStatusCode: error.statusCode,
                }),
                ...extra,
            },
        });
        enrichedError.name = errorToHandle.name;
        enrichedError.stack = errorToHandle.stack;
        enrichedError.cause = errorToHandle.cause;

        sendErrorReport(enrichedError);
    }

    return { errorToHandle, message };
};

export const useSdkErrorHandler = () => {
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
            const { errorToHandle, message } = handleSdkError(error, { fallbackMessage, extra });

            if (showNotification && shouldShowNotification(errorToHandle)) {
                createNotification({ type: 'error', text: message, preWrap: true });
            }
        },
        [createNotification]
    );

    return {
        handleError,
    };
};
