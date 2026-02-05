import { useMeetingDuration } from '../hooks/useMeetingDuration';
import { formatDuration } from '../utils/formatDuration';

export const MeetingDuration = () => {
    const { meetingDurationMs } = useMeetingDuration();

    return (
        <time className="text-2xs color-hint text-tabular-nums" dateTime={formatDuration(meetingDurationMs)}>
            {formatDuration(meetingDurationMs)}
        </time>
    );
};
