import { useCallback, useRef } from 'react';

import type { SeverityLevel } from '@sentry/browser';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';

import { useGetAnalyticsAttributes } from '../contexts/AnalyticsContext';

const MAX_SAME_ERROR = 10;

interface ReportMeetErrorOptions {
    level?: SeverityLevel;
    context?: Record<string, unknown>;
    fingerprint?: string[];
    tags?: Record<string, string>;
}

export type ReportMeetError = (label: string, options?: ReportMeetErrorOptions | unknown) => void;

const isReportMeetErrorOptions = (options: unknown): options is ReportMeetErrorOptions =>
    !!options &&
    typeof options === 'object' &&
    ('context' in options || 'level' in options || 'fingerprint' in options || 'tags' in options);

// We exclude ApiError from using traceError because they are filtered out if not.
const getReportableException = (payload: unknown) =>
    payload instanceof Error && !(payload instanceof ApiError) ? payload : undefined;

export const useMeetErrorReporting = () => {
    const shouldReportError = useFlag('MeetErrorReporting');
    const errorCountMapRef = useRef<Map<string, number>>(new Map());
    const getAnalyticsAttributes = useGetAnalyticsAttributes();

    const reportMeetError = useCallback<ReportMeetError>(
        (label, options) => {
            if (shouldReportError) {
                const currentCount = errorCountMapRef.current.get(label) ?? 0;

                if (currentCount >= MAX_SAME_ERROR) {
                    // do not report the error if it has been reported too many times
                    return;
                }

                errorCountMapRef.current.set(label, currentCount + 1);

                const {
                    level = 'error',
                    context,
                    fingerprint,
                    tags,
                }: ReportMeetErrorOptions = isReportMeetErrorOptions(options)
                    ? options
                    : { context: { error: options } };

                const tagsWithAnalyticsAttributes = { ...getAnalyticsAttributes(), ...tags, label };
                const exception = getReportableException(context?.error);

                if (exception) {
                    traceError(exception, {
                        level,
                        extra: context,
                        tags: tagsWithAnalyticsAttributes,
                        fingerprint: fingerprint ?? [label],
                    });
                    return;
                }

                captureMessage(label, {
                    level,
                    extra: context,
                    fingerprint,
                    tags: tagsWithAnalyticsAttributes,
                });
            }
        },
        [shouldReportError, getAnalyticsAttributes]
    );

    const clearSentryReportErrorCounts = useCallback(() => {
        errorCountMapRef.current.clear();
    }, []);

    return { reportMeetError, clearSentryReportErrorCounts };
};
