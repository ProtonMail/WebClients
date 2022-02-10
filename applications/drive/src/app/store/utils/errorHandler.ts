import { ReactNode } from 'react';

import { useNotifications } from '@proton/components';
import { traceError } from '@proton/shared/lib/helpers/sentry';

const IGNORED_ERRORS = ['AbortError', 'TransferCancel', 'ValidationError'];

export function isIgnoredError(error: any) {
    return !error || IGNORED_ERRORS.includes(error.name);
}

/**
 * logErrors logs error to console if its not ignored error.
 */
export function logError(error: any) {
    if (isIgnoredError(error)) {
        return;
    }

    console.warn(error);
}

/**
 * reportError reports error to console and Sentry if its not ignored error.
 */
export function reportError(error: any) {
    if (isIgnoredError(error)) {
        return;
    }

    console.warn(error);
    traceError(error);
}

export function useErrorHandler() {
    const { createNotification } = useNotifications();

    /**
     * showErrorNotification creates notification with provided `message`
     * or `error` if its not ignored error.
     */
    const showErrorNotification = (error: any, message?: ReactNode) => {
        if (isIgnoredError(error)) {
            return;
        }

        createNotification({
            type: 'error',
            text: message || error.message || error,
        });
    };

    /**
     * showAggregatedErrorNotification creates notification for set of errors
     * with message provided by `getMessage` callback. Only non-ignored errors
     * are passed down to the callback.
     */
    const showAggregatedErrorNotification = (errors: any[], getMessage: (errors: any[]) => ReactNode) => {
        const nonIgnoredErrors = errors.filter((error) => !isIgnoredError(error));
        if (!nonIgnoredErrors.length) {
            return;
        }

        const text = getMessage(nonIgnoredErrors);
        createNotification({
            type: 'error',
            text,
        });
    };

    return {
        showErrorNotification,
        showAggregatedErrorNotification,
    };
}
