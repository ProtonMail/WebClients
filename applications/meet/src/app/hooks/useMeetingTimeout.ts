import { useEffect } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectExpirationTime } from '@proton/meet/store/slices/meetingInfo';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetContext } from '../contexts/MeetContext';

export const useMeetingTimeout = () => {
    const { handleMeetingExpired } = useMeetContext();
    const expirationTime = useMeetSelector(selectExpirationTime);

    const meetUpsellEnabled = useFlag('MeetUpsell');
    const meetMeetingTimeoutEnabled = useFlag('MeetMeetingTimeout');

    useEffect(() => {
        if (!expirationTime || !meetUpsellEnabled || !meetMeetingTimeoutEnabled) {
            return;
        }

        const expirationTimestamp = new Date(expirationTime).getTime();
        const timeUntilExpiration = expirationTimestamp - Date.now();

        const handleTimeout = async () => {
            await handleMeetingExpired();
        };

        if (timeUntilExpiration <= 0) {
            void handleTimeout();
            return;
        }

        const timeoutId = setTimeout(() => {
            void handleTimeout();
        }, timeUntilExpiration);

        return () => clearTimeout(timeoutId);
    }, [expirationTime, meetUpsellEnabled, meetMeetingTimeoutEnabled, handleMeetingExpired]);
};
