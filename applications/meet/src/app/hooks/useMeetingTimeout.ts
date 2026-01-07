import { useEffect } from 'react';

import { useMeetContext } from '../contexts/MeetContext';
import { useIsLocalParticipantAdmin } from './useIsLocalParticipantAdmin';

export const useMeetingTimeout = () => {
    const { expirationTime, handleLeave, handleEndMeeting, isGuestAdmin } = useMeetContext();
    const { isLocalParticipantHost } = useIsLocalParticipantAdmin();

    const isHostOrAdmin = isLocalParticipantHost || isGuestAdmin;

    useEffect(() => {
        if (!expirationTime) {
            return;
        }

        const expirationTimestamp = new Date(expirationTime).getTime();
        const timeUntilExpiration = expirationTimestamp - Date.now();

        const handleTimeout = async () => {
            if (isHostOrAdmin) {
                await handleEndMeeting();
            } else {
                handleLeave();
            }
        };

        if (timeUntilExpiration <= 0) {
            void handleTimeout();
            return;
        }

        const timeoutId = setTimeout(() => {}, timeUntilExpiration);

        return () => clearTimeout(timeoutId);
    }, []);
};
