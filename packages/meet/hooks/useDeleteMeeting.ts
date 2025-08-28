import { useCallback } from 'react';

import { useApi } from '@proton/components';

import { useMeetErrorReporting } from './useMeetErrorReporting';

const deleteMeetingCall = (meetingId: string) => {
    return {
        method: 'delete',
        url: `meet/v1/meetings/${meetingId}`,
        silence: true,
    };
};

export const useDeleteMeeting = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const deleteMeeting = useCallback(
        async (meetingId: string) => {
            try {
                await api(deleteMeetingCall(meetingId));

                return true;
            } catch (error) {
                reportMeetError('Error deleting meeting', error);

                throw error;
            }
        },
        [api]
    );

    return { deleteMeeting };
};
