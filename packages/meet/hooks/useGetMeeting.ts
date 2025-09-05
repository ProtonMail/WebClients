import { useApi } from '@proton/components';
import { getMeetingCall } from '@proton/shared/lib/api/meet';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useGetMeeting = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const getMeeting = async (meetingId: string) => {
        try {
            const response = await api<{ Meeting: Meeting }>(getMeetingCall(meetingId));

            return response.Meeting;
        } catch (error) {
            reportMeetError('Error getting meeting', error);

            throw error;
        }
    };

    return { getMeeting };
};
