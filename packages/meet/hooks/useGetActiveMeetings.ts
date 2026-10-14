import { logger } from '@protontech/logger';

import { useApi } from '@proton/app-context/useApi';
import { getUpcomingMeetingsQuery } from '@proton/shared/lib/api/meet';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

export const useGetActiveMeetings = () => {
    const api = useApi();

    const getActiveMeetings = async () => {
        try {
            const response = await api<{ Meetings: Meeting[] }>(getUpcomingMeetingsQuery);

            return response.Meetings;
        } catch (error) {
            logger.error('Failed to fetch active meetings', error);
        }
    };

    return { getActiveMeetings };
};
