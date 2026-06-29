import { useEffect, useRef } from 'react';

import { announcementMessages } from '../messages';
import { AnnouncementPriority } from '../types';
import { useAnnounce } from '../useAnnounce';

// TURN relay is decided at connection time and stays fixed for the session, so it is announced once.
export const useTurnRelayAnnouncements = (isUsingTurnRelay: boolean) => {
    const announce = useAnnounce();

    const announcedRef = useRef(false);

    useEffect(() => {
        if (!isUsingTurnRelay || announcedRef.current) {
            return;
        }
        announcedRef.current = true;
        announce(announcementMessages.turnRelayActive(), {
            dedupeKey: 'turn-relay-active',
            priority: AnnouncementPriority.High,
        });
    }, [isUsingTurnRelay, announce]);
};
