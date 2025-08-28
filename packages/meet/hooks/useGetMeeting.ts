import { useCallback } from 'react';

import { useApi } from '@proton/components';

import type { Meeting } from '../types/response-types';
import { useMeetErrorReporting } from './useMeetErrorReporting';

const getMeetingCall = (meetingId: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/${meetingId}`,
        silence: true,
    };
};

export const useGetMeeting = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const getMeeting = useCallback(
        async (meetingId: string) => {
            try {
                const response = await api<{ Meeting: Meeting }>(getMeetingCall(meetingId));

                return response.Meeting;
            } catch (error) {
                reportMeetError('Error getting meeting', error);

                throw error;
            }
        },
        [api]
    );

    return { getMeeting };
};
