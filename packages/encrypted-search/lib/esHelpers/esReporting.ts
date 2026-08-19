import { SentryCommonInitiatives, captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';

import { getESLogger } from './esLogger';

export const esErrorReport = (context: string, extra?: Record<string, unknown>) => {
    // Sentry reports alone don't show up in the logs a user can share when reporting a bug,
    // so every ES failure is also written to the host app's logger, if one was set via setESLogger.
    getESLogger().error(`[EncryptedSearch] ${context}`, extra?.error);

    traceError(extra?.error, {
        extra: {
            context,
            ...extra,
        },
        tags: {
            initiative: SentryCommonInitiatives.ENCRYPTED_SEARCH,
            context,
        },
    });
};

/**
 * Helper to send ES-related sentry reports
 * @param errorMessage the error message that will appear in the title of the log
 * @param extra any other contextual information that will be attached to the log
 */
export const esSentryReport = (errorMessage: string, extra?: any) => {
    // if there is an error, use esErrorReport, otherwise use captureMessage
    if (extra?.error != null) {
        esErrorReport(errorMessage, extra);
    } else {
        getESLogger().warn(`[EncryptedSearch] ${errorMessage}`);
        captureMessage(`[EncryptedSearch] ${errorMessage}`, { extra });
    }
};
