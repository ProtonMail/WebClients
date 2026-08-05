import { useApi } from '@proton/components';
import { toggleWaitingRoom } from '@proton/shared/lib/api/meet';
import type { CreateMeetingResponse, WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useUpdateMeetingWaitingRoom = () => {
    const api = useApi();

    const { reportMeetError } = useMeetErrorReporting();

    const updateMeetingWaitingRoom = async ({
        meetingLinkName,
        waitingRoom,
        silence = true,
    }: {
        meetingLinkName: string;
        waitingRoom: WaitingRoomState;
        silence?: boolean;
    }) => {
        try {
            const { Meeting } = await api<CreateMeetingResponse>({
                ...toggleWaitingRoom(meetingLinkName, { WaitingRoom: waitingRoom }),
                silence,
            });

            return Meeting;
        } catch (error) {
            reportMeetError('Error updating meeting waiting room status', error);

            throw error;
        }
    };

    return { updateMeetingWaitingRoom };
};
