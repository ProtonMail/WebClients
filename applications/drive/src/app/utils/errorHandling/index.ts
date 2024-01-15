import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { EnrichedError, isEnrichedError } from './EnrichedError';
import { isValidationError } from './ValidationError';

const IGNORED_ERRORS = ['AbortError', 'TransferCancel'];

export function isIgnoredErrorForReporting(error: any) {
    return isIgnoredError(error) || isValidationError(error) || getIsConnectionIssue(error);
}

export function isIgnoredError(error: any) {
    return !error || IGNORED_ERRORS.includes(error.name);
}

/**
 * logErrors logs error to console if its not ignored error.
 */
export function logError(error: unknown) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    console.warn(error);
}

/**
 * sendErrorReport reports error to console and Sentry if its not ignored error.
 *
 * Also attaches proper data to Sentry if an EnrichedError is passed, or alternatively context can be passed directly.
 */
export function sendErrorReport(error: Error | EnrichedError | unknown) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    console.warn(error);
    traceError(error, isEnrichedError(error) ? error.context : undefined);
}
