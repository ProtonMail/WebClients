import { type MutableRefObject, useCallback, useRef } from 'react';

import { type ReportMeetError, useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

export interface UseMeetingErrorContextResult {
    meetingLinkNameRef: MutableRefObject<string>;
    withMeetingLinkNameTag: (options?: unknown) => unknown;
    reportMeetError: ReportMeetError;
    clearSentryReportErrorCounts: () => void;
}

export const useMeetingErrorContext = (): UseMeetingErrorContextResult => {
    const { reportMeetError, clearSentryReportErrorCounts } = useMeetErrorReporting();

    const meetingLinkNameRef = useRef<string>('');

    const withMeetingLinkNameTag = useCallback((options?: unknown) => {
        const meetingLinkName = meetingLinkNameRef.current;
        if (!meetingLinkName) {
            return options;
        }

        const tags = { meetingLinkName };
        if (typeof options === 'string') {
            return { context: { error: options }, tags };
        } else if (options && typeof options === 'object') {
            const optionsWithTags = options as { tags?: Record<string, string> };
            return {
                ...optionsWithTags,
                tags: {
                    ...(optionsWithTags.tags ?? {}),
                    ...tags,
                },
            };
        }
        return { tags };
    }, []);

    return {
        meetingLinkNameRef,
        withMeetingLinkNameTag,
        reportMeetError,
        clearSentryReportErrorCounts,
    };
};
