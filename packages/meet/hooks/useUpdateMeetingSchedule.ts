import { c } from 'ttag';

import { useApi } from '@proton/components';
import { updateMeetingScheduleCall } from '@proton/shared/lib/api/meet';
import type { CreateMeetingResponse } from '@proton/shared/lib/interfaces/Meet';

import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useUpdateMeetingSchedule = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const updateMeetingSchedule = async (
        meetingId: string,
        startTime: string,
        endTime: string,
        recurrence: string | null,
        timezone: string
    ) => {
        try {
            const { Meeting } = await api<CreateMeetingResponse>({
                ...updateMeetingScheduleCall(meetingId, {
                    StartTime: startTime,
                    EndTime: endTime,
                    RRule: recurrence,
                    Timezone: timezone,
                }),
            });

            return Meeting;
        } catch (error) {
            reportMeetError('Error updating meeting schedule', error);

            throw new Error(c('Info').t`Failed to update meeting schedule`);
        }
    };

    return { updateMeetingSchedule };
};
