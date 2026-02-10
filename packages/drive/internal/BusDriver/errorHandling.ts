import type { ScopeContext } from '@sentry/types';

import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { isProduction, traceError } from '@proton/shared/lib/helpers/sentry';

import { Logging } from '../../modules/logging';

const hasSentryMessage = (error: unknown): error is Error & { sentryMessage: string } =>
    error instanceof Error && 'sentryMessage' in error && typeof error.sentryMessage === 'string';

const errorHandlingLogger = new Logging({ sentryComponent: 'drive-web-log' }).getLogger('bus-driver-error-handling');

export function sendErrorReport(error: Error | unknown, additionalContext?: Partial<ScopeContext>) {
    let errorForReporting = error as Error;

    if (hasSentryMessage(error)) {
        errorForReporting = new Error(error.sentryMessage);
        errorForReporting.name = error.name;
        errorForReporting.stack = error.stack;
    }

    const context = additionalContext || {};

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

    errorHandlingLogger.warn(
        `[BusDriver] Error captured: ${error instanceof Error ? error.message : String(error)} | context: ${JSON.stringify(context)}`
    );
    traceError(errorForReporting, context);
}
