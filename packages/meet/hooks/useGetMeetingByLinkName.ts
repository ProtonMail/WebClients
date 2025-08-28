import { useCallback } from 'react';

import { useApi } from '@proton/components';

import type { Meeting } from '../types/response-types';
import { useMeetErrorReporting } from './useMeetErrorReporting';

const getMeetingByLinkNameCall = (meetingId: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/by-link/${meetingId}`,
        silence: true,
    };
};

export const useGetMeetingByLinkName = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const getMeetingByLinkName = useCallback(
        async (meetingId: string) => {
            try {
                const response = await api<{ Meeting: Meeting }>(getMeetingByLinkNameCall(meetingId));

                return response.Meeting;
            } catch (error) {
                reportMeetError('Error getting meeting by link name', error);

                throw error;
            }
        },
        [api]
    );

    return { getMeetingByLinkName };
};
