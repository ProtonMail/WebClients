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

type ValidatedField = 'meetingName' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'timeZone';

export type FormErrors = Partial<Record<ValidatedField, string | true>>;

export type OnDateTimeChange = (params: { fieldName: string; value: Date | string | undefined }) => void;
