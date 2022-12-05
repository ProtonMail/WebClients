import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { traceError } from '@proton/shared/lib/helpers/sentry';

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
export function logError(error: any) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    console.warn(error);
}

/**
 * sendErrorReport reports error to console and Sentry if its not ignored error.
 */
export function sendErrorReport(error: any) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    console.warn(error);
    traceError(error);
}
