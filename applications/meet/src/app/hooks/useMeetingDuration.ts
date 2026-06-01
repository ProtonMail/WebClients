import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsExpiringSoon, selectMeetingDurationMs, selectTimeLeftMs } from '@proton/meet/store/slices/meetingInfo';

export const useMeetingDuration = () => {
    const meetingDurationMs = useMeetSelector(selectMeetingDurationMs);
    const timeLeftMs = useMeetSelector(selectTimeLeftMs);
    const isExpiringSoon = useMeetSelector(selectIsExpiringSoon);

    return { meetingDurationMs, timeLeftMs, isExpiringSoon };
};
