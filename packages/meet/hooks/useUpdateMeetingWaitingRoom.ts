import { useApi } from '@proton/components';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { toggleWaitingRoom } from '@proton/shared/lib/api/meet';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
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
            const { code } = getApiError(error);

            const DONT_REPORT_TO_SENTRY_ERROR_CODES = [
                // Meeting is active. Update waiting room setting inside the meeting
                API_CUSTOM_ERROR_CODES.INVALID_REQUIREMENT,
            ];

            if (!DONT_REPORT_TO_SENTRY_ERROR_CODES.includes(code)) {
                reportMeetError(`Error updating meeting waiting room status: ${code}`, error);
            }

            throw error;
        }
    };

    return { updateMeetingWaitingRoom };
};
