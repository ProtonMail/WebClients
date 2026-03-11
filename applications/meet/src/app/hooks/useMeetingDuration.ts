import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectExpirationTime, selectMaxDuration } from '@proton/meet/store/slices/meetingInfo';
import { MINUTE } from '@proton/shared/lib/constants';

export const useMeetingDuration = () => {
    const expirationTime = useMeetSelector(selectExpirationTime);
    const maxDuration = useMeetSelector(selectMaxDuration);

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
