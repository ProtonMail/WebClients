import { type MutableRefObject, useRef } from 'react';

import { type ReportMeetError, useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

export interface UseMeetingErrorContextResult {
    meetingLinkNameRef: MutableRefObject<string>;
    reportMeetError: ReportMeetError;
    clearSentryReportErrorCounts: () => void;
}

export const useMeetingErrorContext = (): UseMeetingErrorContextResult => {
    const { reportMeetError, clearSentryReportErrorCounts } = useMeetErrorReporting();

    const meetingLinkNameRef = useRef<string>('');

    return {
        meetingLinkNameRef,
        reportMeetError,
        clearSentryReportErrorCounts,
    };
};
