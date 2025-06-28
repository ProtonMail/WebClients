import { useCallback } from 'react';

import { c } from 'ttag';

import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { traceError as traceSentryError } from '@proton/shared/lib/helpers/sentry';

import useNotifications from './useNotifications';

const ignoreErrors = ['InactiveSession', 'AppVersionBadError', 'AbortError'];

/**
 * Don't allow tracing of api errors
 */
export const shouldTraceError = (error: any) => {
    const apiErrorMessage = getApiErrorMessage(error);
    return error.trace !== false && !apiErrorMessage;
};

interface ErrorHandlerOptions {
    notify?: boolean;
    trace?: boolean;
    traceError?: (error: any) => void;
}

const useErrorHandler = () => {
    const { createNotification } = useNotifications();

    return useCallback(
        (error: any, { notify = true, trace = true, traceError = traceSentryError }: ErrorHandlerOptions = {}) => {
            if (!error) {
                return;
            }

            const apiErrorMessage = getApiErrorMessage(error);
            const errorMessage = error.message || c('Error').t`Unknown error`;

            // Bad app version and unreachable errors are handled in a top banner
            const shouldNotify = notify && !error.cancel && !ignoreErrors.includes(error.name);
            if (shouldNotify) {
                createNotification({ type: 'error', text: apiErrorMessage || errorMessage });
            }

            const shouldTrace = trace && shouldTraceError(error);
            if (shouldTrace) {
                traceError(error);
            }
        },
        []
    );
};

export default useErrorHandler;

/**
 * Will notify user of error through a toast.
 * Won't report the error to sentry.
 */
export const useNotifyErrorHandler = () => {
    const handleError = useErrorHandler();

    return (error: any) => handleError(error, { notify: true, trace: false });
};
