import { useCallback } from 'react';

import type { SeverityLevel } from '@sentry/browser';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash';

interface ReportMeetErrorOptions {
    level?: SeverityLevel;
    context?: Record<string, unknown>;
    fingerprint?: string[];
}

export const useMeetErrorReporting = () => {
    const shouldReportError = useFlag('MeetErrorReporting');

    const reportMeetError = useCallback(
        (label: string, options?: ReportMeetErrorOptions | unknown) => {
            if (shouldReportError) {
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

    return reportMeetError;
};
