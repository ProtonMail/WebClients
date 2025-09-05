import { useApi } from '@proton/components';
import { getMeetingByLinkNameCall } from '@proton/shared/lib/api/meet';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useGetMeetingByLinkName = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const getMeetingByLinkName = async (meetingId: string) => {
        try {
            const response = await api<{ Meeting: Meeting }>(getMeetingByLinkNameCall(meetingId));

            return response.Meeting;
        } catch (error) {
            reportMeetError('Error getting meeting by link name', error);

            throw error;
        }
    };

    return { getMeetingByLinkName };
};
