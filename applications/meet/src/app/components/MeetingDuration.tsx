import { useMeetingDuration } from '../hooks/useMeetingDuration';
import { formatDuration } from '../utils/formatDuration';

export const MeetingDuration = () => {
    const { meetingDurationMs } = useMeetingDuration();

    return <span className="text-2xs color-hint">{formatDuration(meetingDurationMs)}</span>;
};
