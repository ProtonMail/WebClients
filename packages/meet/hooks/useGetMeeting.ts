import { useCallback } from 'react';

import { useApi } from '@proton/components';

import type { Meeting } from '../types/response-types';

const getMeetingCall = (meetingId: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/${meetingId}`,
        silence: true,
    };
};

export const useGetMeeting = () => {
    const api = useApi();

    const getMeeting = useCallback(
        async (meetingId: string) => {
            try {
                const response = await api<{ Meeting: Meeting }>(getMeetingCall(meetingId));

                return response.Meeting;
            } catch (error) {
                console.error(error);
            }
        },
        [api]
    );

    return { getMeeting };
};
