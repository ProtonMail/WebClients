import type { ScopeContext } from '@sentry/types';

import metrics from '@proton/metrics/index';
import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { isProduction, traceError } from '@proton/shared/lib/helpers/sentry';

import { driveMetrics } from '../../modules/metrics';
import type { EnrichedError } from './EnrichedError';
import { isEnrichedError } from './EnrichedError';
import { RefreshError } from './RefreshError';
import { isValidationError } from './ValidationError';

const IGNORED_ERRORS = ['AbortError', 'TransferCancel', 'OfflineError'];

export function isIgnoredErrorForReporting(error: any) {
    return isIgnoredError(error) || isValidationError(error) || getIsConnectionIssue(error);
}

export function isIgnoredError(error: any) {
    return !error || IGNORED_ERRORS.includes(error.name);
}

export function isAbortError(error: any) {
    return error && (error.name === 'AbortError' || error.name === 'TransferCancel');
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
export function sendErrorReport(error: Error | EnrichedError | unknown, additionalContext?: Partial<ScopeContext>) {
    if (isIgnoredErrorForReporting(error)) {
        return;
    }

    // RefreshError is used in legacy upload when there is issue with the upload web worker.
    // The error has no additional context and we want this to be reported to metrics for observability.
    if (error instanceof RefreshError) {
        metrics.drive_warnings_total.increment({ warning: 'app_outdated' });
        return;
    }

    driveMetrics.globalErrors.markOtherError();

    let errorForReporting = error as Error;

    if (hasSentryMessage(error)) {
        errorForReporting = new Error(error.sentryMessage);
        errorForReporting.name = error.name;
        errorForReporting.stack = error.stack;
    }

    const context = Object.assign({}, isEnrichedError(error) ? error.context || {} : {}, additionalContext || {});

    if (typeof window !== 'undefined' && isProduction(window.location.host)) {
        const cookieTag = getCookie('Tag') || 'prod';
        if (cookieTag) {
            if (context.tags) {
                context.tags.stage = cookieTag;
            } else {
                context.tags = { stage: cookieTag };
            }
        }
    }

    console.warn(error, context);
    traceError(errorForReporting, context);
}

export function errorToString(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
