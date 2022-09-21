import { ReactNode } from 'react';

import { useNotifications } from '@proton/components';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { ValidationError, isValidationError } from './validationError';

const IGNORED_ERRORS = ['AbortError', 'TransferCancel'];

function isIgnoredErrorForReporting(error: any) {
    return isIgnoredError(error) || isValidationError(error) || getIsConnectionIssue(error);
}

export function isIgnoredError(error: any) {
    return !error || IGNORED_ERRORS.includes(error.name);
}

/**
 * logErrors logs error to console if its not ignored error.
 */
export function logError(error: any) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    console.warn(error);
}

/**
 * reportError reports error to console and Sentry if its not ignored error.
 */
export function reportError(error: any) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    console.warn(error);
    traceError(error);
}

/**
 * generateErrorHandler generates error handler calling callback if the error
 * is not ignored error.
 */
export function generateErrorHandler(callback: (error: any) => void) {
    return (error: any) => {
        if (isIgnoredErrorForReporting(error)) {
            return;
        }

        callback(error);
    };
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

        // API errors are handled automatically by core.
        if (!!error.data?.Error) {
            return;
        }

        if (isValidationError(error)) {
            createNotification({
                type: 'error',
                text: error.message,
            });
            return;
        }

        createNotification({
            type: 'error',
            text: message || error.message || error,
        });
        reportError(error);
    };

    /**
     * showAggregatedErrorNotification creates notification for set of errors
     * with message provided by `getMessage` callback. Only non-ignored errors
     * are passed down to the callback.
     */
    const showAggregatedErrorNotification = (errors: any[], getMessage: (errors: [any, ...any[]]) => ReactNode) => {
        const nonIgnoredErrors = errors.filter((error) => !isIgnoredError(error));
        if (!nonIgnoredErrors.length) {
            return;
        }

        const validationErrors: ValidationError[] = Object.values(
            nonIgnoredErrors.filter(isValidationError).reduce((acc, error) => {
                if (!acc[error.message]) {
                    acc[error.message] = error;
                }
                return acc;
            }, {} as Record<string, ValidationError>)
        );

        validationErrors.forEach((error) => {
            createNotification({
                type: 'error',
                text: error.message,
            });
        });

        const unknownErrors = nonIgnoredErrors.filter((error) => !isValidationError(error));

        if (unknownErrors.length !== 0) {
            const text = getMessage(unknownErrors as [any, ...any[]]);

            createNotification({
                type: 'error',
                text,
            });
        }

        errors.forEach(reportError);
    };

    return {
        showErrorNotification,
        showAggregatedErrorNotification,
    };
}
