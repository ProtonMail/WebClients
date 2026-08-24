import { useApi } from '@proton/app-context/useApi';
import { deleteMeetingCall } from '@proton/shared/lib/api/meet';

import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useDeleteMeeting = () => {
    const api = useApi();

    const { reportMeetError } = useMeetErrorReporting();

    const deleteMeeting = async (meetingId: string) => {
        try {
            await api(deleteMeetingCall(meetingId));

            return true;
        } catch (error) {
            reportMeetError('Error deleting meeting', error);

            throw error;
        }
    };

    return { deleteMeeting };
};
