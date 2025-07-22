import { useCallback } from 'react';

import { useApi } from '@proton/components';

const deleteMeetingCall = (meetingId: string) => {
    return {
        method: 'delete',
        url: `meet/v1/meetings/${meetingId}`,
        silence: true,
    };
};

export const useDeleteMeeting = () => {
    const api = useApi();

    const deleteMeeting = useCallback(
        async (meetingId: string) => {
            try {
                await api(deleteMeetingCall(meetingId));

                return true;
            } catch (error) {
                console.error(error);
            }
        },
        [api]
    );

    return { deleteMeeting };
};
