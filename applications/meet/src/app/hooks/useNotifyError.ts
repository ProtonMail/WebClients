import { useCallback } from 'react';

import { useNotifications } from '@proton/app-context/useNotifications';

import { AnnouncementPriority } from '../components/MeetingAnnouncer/types';
import { useAnnounce } from '../components/MeetingAnnouncer/useAnnounce';

/**
 * Shows an error notification and simultaneously announces it to assistive
 * technology at high priority, keeping the two in sync.
 */
export const useNotifyError = () => {
    const { createNotification } = useNotifications();
    const announce = useAnnounce();

    return useCallback(
        (text: string) => {
            createNotification({ type: 'error', text });
            announce(text, { priority: AnnouncementPriority.High });
        },
        [createNotification, announce]
    );
};
