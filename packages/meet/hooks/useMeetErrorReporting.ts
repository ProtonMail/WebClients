import { useCallback, useRef } from 'react';

import type { SeverityLevel } from '@sentry/browser';
import type { Primitive } from '@sentry/types';

import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';

import { useGetAnalyticsAttributes } from '../contexts/AnalyticsContext';

const MAX_SAME_ERROR = 10;

type MeetCoreErrorResolver = (error: unknown) => string | undefined;

let resolveMeetCoreError: MeetCoreErrorResolver = () => undefined;

// This package is shared with apps that do not ship the meet-core wasm bundle, so it cannot import
// the error enum. The Meet app registers the resolver at bootstrap instead.
export const setMeetCoreErrorResolver = (resolver: MeetCoreErrorResolver) => {
    resolveMeetCoreError = resolver;
};

interface ReportMeetErrorOptions {
    level?: SeverityLevel;
    context?: Record<string, unknown>;
    fingerprint?: string[];
    tags?: Record<string, Primitive>;
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
    const removeSentryEventLimit = useFlag('MeetRemoveSentryEventLimit');
    const errorCountMapRef = useRef<Map<string, number>>(new Map());
    const getAnalyticsAttributes = useGetAnalyticsAttributes();

    const reportMeetError = useCallback<ReportMeetError>(
        (label, options) => {
            if (shouldReportError) {
                const {
                    level = 'error',
                    context,
                    fingerprint,
                    tags,
                }: ReportMeetErrorOptions = isReportMeetErrorOptions(options)
                    ? options
                    : { context: { error: options } };

                const meetCoreError = resolveMeetCoreError(context?.error);
                const reportLabel = meetCoreError ? `${label}: ${meetCoreError}` : label;

                const currentCount = errorCountMapRef.current.get(reportLabel) ?? 0;

                if (!removeSentryEventLimit && currentCount >= MAX_SAME_ERROR) {
                    // do not report the error if it has been reported too many times
                    return;
                }

                errorCountMapRef.current.set(reportLabel, currentCount + 1);

                const tagsWithAnalyticsAttributes = {
                    ...getAnalyticsAttributes(),
                    ...(meetCoreError && { meetCoreError }),
                    ...tags,
                    label,
                };
                const exception = getReportableException(context?.error);

                if (exception) {
                    traceError(exception, {
                        level,
                        extra: context,
                        tags: tagsWithAnalyticsAttributes,
                        fingerprint: fingerprint ?? [reportLabel],
                    });
                    return;
                }

                captureMessage(reportLabel, {
                    level,
                    extra: context,
                    fingerprint,
                    tags: tagsWithAnalyticsAttributes,
                });
            }
        },
        [shouldReportError, removeSentryEventLimit, getAnalyticsAttributes]
    );

    const clearSentryReportErrorCounts = useCallback(() => {
        errorCountMapRef.current.clear();
    }, []);

    return { reportMeetError, clearSentryReportErrorCounts };
};
