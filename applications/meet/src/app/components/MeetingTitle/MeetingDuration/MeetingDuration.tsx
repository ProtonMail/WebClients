import { useMeetingDuration } from '../../../hooks/useMeetingDuration';
import { formatDuration } from '../../../utils/formatDuration';

import './MeetingDuration.scss';

export const MeetingDuration = () => {
    const { meetingDurationMs } = useMeetingDuration();

    return (
        <time className="meeting-duration color-hint text-tabular-nums" dateTime={formatDuration(meetingDurationMs)}>
            {formatDuration(meetingDurationMs)}
        </time>
    );
};
