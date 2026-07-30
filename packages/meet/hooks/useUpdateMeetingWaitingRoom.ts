import { c } from 'ttag';

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
    }: {
        meetingLinkName: string;
        waitingRoom: WaitingRoomState;
    }) => {
        try {
            const { Meeting } = await api<CreateMeetingResponse>({
                ...toggleWaitingRoom(meetingLinkName, { WaitingRoom: waitingRoom }),
            });

            return Meeting;
        } catch (error) {
            reportMeetError('Error updating meeting waiting room status', error);

            throw new Error(c('Info').t`Failed to update meeting waiting room status`);
        }
    };

    return { updateMeetingWaitingRoom };
};
