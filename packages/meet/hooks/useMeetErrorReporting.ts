import { useCallback, useRef } from 'react';

import type { SeverityLevel } from '@sentry/browser';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';

const MAX_SAME_ERROR = 10;

interface ReportMeetErrorOptions {
    level?: SeverityLevel;
    context?: Record<string, unknown>;
    fingerprint?: string[];
}

export type ReportMeetError = (label: string, options?: ReportMeetErrorOptions | unknown) => void;

export const useMeetErrorReporting = () => {
    const shouldReportError = useFlag('MeetErrorReporting');
    const errorCountMapRef = useRef<Map<string, number>>(new Map());

    const reportMeetError = useCallback<ReportMeetError>(
        (label, options) => {
            if (shouldReportError) {
                const currentCount = errorCountMapRef.current.get(label) ?? 0;

                if (currentCount >= MAX_SAME_ERROR) {
                    // do not report the error if it has been reported too many times
                    return;
                }

                errorCountMapRef.current.set(label, currentCount + 1);

                if (options && typeof options === 'object' && 'context' in options) {
                    const { level = 'error', context, fingerprint } = options as ReportMeetErrorOptions;
                    captureMessage(label, {
                        level,
                        extra: context,
                        fingerprint,
                    });
                } else {
                    captureMessage(label, { level: 'error', extra: { error: options } });
                }
            }
        },
        [shouldReportError]
    );

    const clearSentryReportErrorCounts = useCallback(() => {
        errorCountMapRef.current.clear();
    }, []);

    return { reportMeetError, clearSentryReportErrorCounts };
};
