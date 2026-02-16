import clsx from '@proton/utils/clsx';

import { useMeetingDuration } from '../../hooks/useMeetingDuration';
import { formatDuration } from '../../utils/formatDuration';

import './MeetingDuration.scss';

export const MeetingDuration = ({ className }: { className?: string }) => {
    const { meetingDurationMs } = useMeetingDuration();

    return (
        <time
            className={clsx('meeting-duration color-hint text-tabular-nums', className)}
            dateTime={formatDuration(meetingDurationMs)}
        >
            {formatDuration(meetingDurationMs)}
        </time>
    );
};
