import type { WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

export interface FormValues {
    meetingName: string;
    startDate: Date;
    startTime: string;
    endDate: Date;
    endTime: string;
    timeZone: string;
    recurrence: string;
    // Make waitingRoom mandatory when cleanup MeetWaitingRoom feature flag
    waitingRoom?: WaitingRoomState;
}

export type OnDateTimeChange = (params: { fieldName: string; value: Date | string | undefined }) => void;
