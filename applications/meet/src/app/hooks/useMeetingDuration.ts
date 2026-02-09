import { useEffect, useState } from 'react';

import { MINUTE } from '@proton/shared/lib/constants';

import { useMeetContext } from '../contexts/MeetContext';

export const useMeetingDuration = () => {
    const { expirationTime, maxDuration } = useMeetContext();

    const [meetingDurationMs, setMeetingDurationMs] = useState(0);
    const [timeLeftMs, setTimeLeftMs] = useState(0);
    const [isExpiringSoon, setIsExpiringSoon] = useState(false);

    useEffect(() => {
        const updateDuration = () => {
            if (!expirationTime) {
                return;
            }
            const expirationTimestamp = new Date(expirationTime).getTime();
            const duration = Date.now() - (expirationTimestamp - maxDuration * 1000);
            const remainingTime = expirationTimestamp - Date.now();

            setMeetingDurationMs(Math.max(0, duration));
            setTimeLeftMs(Math.max(0, remainingTime));
            setIsExpiringSoon(remainingTime <= 5 * MINUTE);
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);

        return () => clearInterval(interval);
    }, [expirationTime, maxDuration]);

    return { meetingDurationMs, timeLeftMs, isExpiringSoon };
};
