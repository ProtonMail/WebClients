import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash';

export const useMeetErrorReporting = () => {
    const shouldReportError = useFlag('MeetErrorReporting');

    const reportMeetError = (label: string, error: unknown) => {
        if (shouldReportError) {
            captureMessage(label, { level: 'error', extra: { error } });
        }
    };

    return reportMeetError;
};
