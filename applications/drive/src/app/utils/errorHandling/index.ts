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

const hasSentryMessage = (error: unknown): error is Error & { sentryMessage: string } =>
    error instanceof Error && 'sentryMessage' in error && typeof error.sentryMessage === 'string';

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

    let errorForReporting = error as Error;

    if (hasSentryMessage(error)) {
        errorForReporting = new Error(error.sentryMessage);
        errorForReporting.name = error.name;
        errorForReporting.stack = error.stack;
    }

    const context = isEnrichedError(error) ? error.context : undefined;
    traceError(errorForReporting, context);
}
