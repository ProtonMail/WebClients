import { SentryCommonInitiatives, captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';

export const esErrorReport = (context: string, extra?: Record<string, unknown>) => {
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
        captureMessage(`[EncryptedSearch] ${errorMessage}`, { extra });
    }
};
