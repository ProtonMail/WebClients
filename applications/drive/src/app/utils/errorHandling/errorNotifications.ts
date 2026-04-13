import { getNotificationsManager } from '../../modules/notifications';
import { isIgnoredError, sendErrorReport } from '../../utils/errorHandling';
import type { ValidationError } from '../../utils/errorHandling/ValidationError';
import { isValidationError } from '../../utils/errorHandling/ValidationError';

/**
 * showAggregatedErrorNotification creates notification for set of errors
 * with message provided by `getMessage` callback. Only non-ignored errors
 * are passed down to the callback.
 */
export const showAggregatedErrorNotification = <T extends unknown>(
    errors: T[],
    getMessage: (error: T) => string,
    getFallbackMessage: (errors: T[]) => string
) => {
    const nonIgnoredErrors = (errors as unknown[]).filter((error) => !isIgnoredError(error));
    if (!nonIgnoredErrors.length) {
        return;
    }

    const validationErrors: ValidationError[] = Object.values(
        nonIgnoredErrors.filter(isValidationError).reduce(
            (acc, error) => {
                if (!acc[error.message]) {
                    acc[error.message] = error;
                }
                return acc;
            },
            {} as Record<string, ValidationError>
        )
    );

    validationErrors.forEach((error) => {
        getNotificationsManager().createNotification({ type: 'error', text: error.message });
    });

    const unknownErrors = nonIgnoredErrors.filter((error) => !isValidationError(error)) as T[];

    if (unknownErrors.length !== 0) {
        const errorMessages = unknownErrors.map((e) => getMessage(e));
        // If we have multiple messages that are exactly the same we show that message (just once)
        // Otherwise we show the fallback error message
        let unifiedErrorMessage: string | null = errorMessages[0];
        for (const m of errorMessages) {
            if (m !== unifiedErrorMessage) {
                unifiedErrorMessage = null;
                break;
            }
        }

        getNotificationsManager().createNotification({
            type: 'error',
            text: unifiedErrorMessage ?? getFallbackMessage(unknownErrors),
        });
    }

    errors.forEach((e) => sendErrorReport(e));
};
