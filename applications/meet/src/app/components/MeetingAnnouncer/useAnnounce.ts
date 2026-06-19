import { useContext } from 'react';

import { MeetingAnnouncerContext } from './MeetingAnnouncerContext';
import type { AnnounceFn } from './types';

export const useAnnounce = (): AnnounceFn => {
    const context = useContext(MeetingAnnouncerContext);
    if (!context) {
        throw new Error('useAnnounce must be used within a MeetingAnnouncerProvider');
    }

    const { announce } = context;
    return announce;
};
