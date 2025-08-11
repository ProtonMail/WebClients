import { useCallback } from 'react';

import { useNotifications } from '@proton/components';
import { AbortError, ConnectionError, ProtonDriveError, RateLimitedError, ValidationError } from '@proton/drive';

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

export const useSdkErrorHandler = () => {
    const { createNotification } = useNotifications();

    const handleError = useCallback(
        (
            error: Error | unknown,
            { fallbackMessage = '', extra = {}, showNotification = true }: HandleErrorOptions = {}
        ) => {
            const errorToHandle = error instanceof Error ? error : new Error(fallbackMessage);
            const message = error instanceof ProtonDriveError ? errorToHandle.message : fallbackMessage;
            if (showNotification && shouldShowNotification(errorToHandle)) {
                createNotification({ type: 'error', text: message, preWrap: true });
            }

            console.error(errorToHandle);
            if (shouldTrackError(errorToHandle)) {
                sendErrorReport(new EnrichedError(errorToHandle.message, { tags: { component: 'drive-sdk' }, extra }));
            }
        },
        [createNotification]
    );

    return {
        handleError,
    };
};
