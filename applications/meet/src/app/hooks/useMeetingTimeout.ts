import { useEffect } from 'react';

import useFlag from '@proton/unleash/useFlag';

import { useMeetContext } from '../contexts/MeetContext';
import { useIsLocalParticipantAdmin } from './useIsLocalParticipantAdmin';

export const useMeetingTimeout = () => {
    const { expirationTime, handleLeave, handleEndMeeting, isGuestAdmin } = useMeetContext();
    const { isLocalParticipantHost } = useIsLocalParticipantAdmin();

    const meetUpsellEnabled = useFlag('MeetUpsell');

    const isHostOrAdmin = isLocalParticipantHost || isGuestAdmin;

    useEffect(() => {
        if (!expirationTime || !meetUpsellEnabled) {
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

        const timeoutId = setTimeout(() => {
            void handleTimeout();
        }, timeUntilExpiration);

        return () => clearTimeout(timeoutId);
    }, []);
};
