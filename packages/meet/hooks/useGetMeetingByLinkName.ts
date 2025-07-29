import { useCallback } from 'react';

import { useApi } from '@proton/components';

import type { Meeting } from '../types/response-types';

const getMeetingByLinkNameCall = (meetingId: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/by-link/${meetingId}`,
        silence: true,
    };
};

export const useGetMeetingByLinkName = () => {
    const api = useApi();

    const getMeetingByLinkName = useCallback(
        async (meetingId: string) => {
            try {
                const response = await api<{ Meeting: Meeting }>(getMeetingByLinkNameCall(meetingId));

                return response.Meeting;
            } catch (error) {
                console.error(error);
            }
        },
        [api]
    );

    return { getMeetingByLinkName };
};
