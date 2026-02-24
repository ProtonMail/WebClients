import { c } from 'ttag';

import {
    AbortError,
    ConnectionError,
    DecryptionError,
    ProtonDriveError,
    RateLimitedError,
    ServerError,
    ValidationError,
} from '@proton/drive';

import { sendErrorReport } from '.';
import { getNotificationsManager } from '../../modules/notifications';
import { EnrichedError } from './EnrichedError';

export const shouldTrackError = (err: Error) =>
    !(err instanceof ValidationError) &&
    !(err instanceof AbortError) &&
    !(err instanceof RateLimitedError) &&
    !(err instanceof ConnectionError) &&
    // All decryption errors are handled by the metric system.
    // It goes to metrics and for cases we need to investigate we also report
    // individual cases to Sentry. This error will be thrown to client in cases
    // where client is listing nodes and some nodes cannot be returned.
    !(err instanceof DecryptionError);

export const shouldShowNotification = (err: Error) => !(err instanceof AbortError);

type HandleErrorOptions = {
    fallbackMessage?: string;
    extra?: {};
    showNotification?: boolean;
};

/**
 * It DOES NOT show any notification to the user.
 */
export const handleSdkError = (
    error: Error | unknown,
    { fallbackMessage = c('Error').t`An error occurred`, extra = {}, showNotification = true }: HandleErrorOptions = {}
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
                ...(error instanceof EnrichedError && {
                    ...error.context?.extra,
                }),
                // Do not use fallbackMessage here, as it might include PII in some cases.
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
    if (showNotification && shouldShowNotification(errorToHandle)) {
        getNotificationsManager().createNotification({ type: 'error', text: message, preWrap: true });
    }
};
