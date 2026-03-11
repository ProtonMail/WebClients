import {
    AbortError,
    ConnectionError,
    DecryptionError,
    ProtonDriveError,
    RateLimitedError,
    ServerError,
    ValidationError,
} from '@protontech/drive-sdk';
import { c } from 'ttag';

import { traceError } from '@proton/shared/lib/helpers/sentry';

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
 * Drive error handler
 */
export const handleDriveError = (
    error: Error | unknown,
    { fallbackMessage = c('Error').t`An error occurred`, extra = {} }: HandleErrorOptions = {}
) => {
    const errorToHandle =
        error instanceof Error ? error : new Error(error instanceof ProtonDriveError ? error.message : fallbackMessage);

    console.error(errorToHandle);
    if (shouldTrackError(errorToHandle)) {
        const errorContext = {
            tags: {
                component: 'drive-package',
            },
            extra: {
                // Do not use fallbackMessage here, as it might include PII in some cases.
                ...(error instanceof ServerError && {
                    serverErrorCode: error.code,
                    serverErrorStatusCode: error.statusCode,
                }),
                ...extra,
            },
        };

        traceError(errorToHandle, errorContext);
    }
};
