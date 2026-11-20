import { useApi } from '@proton/app-context/useApi';
import { getUpcomingMeetingsQuery } from '@proton/shared/lib/api/meet';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { meetingLogger } from '../utils/meetingLogger';

export const useGetActiveMeetings = () => {
    const api = useApi();

    const getActiveMeetings = async () => {
        try {
            const response = await api<{ Meetings: Meeting[] }>(getUpcomingMeetingsQuery);

            return response.Meetings;
        } catch (error) {
            meetingLogger.error('Failed to fetch active meetings', error);
        }
    };

    return { getActiveMeetings };
};
