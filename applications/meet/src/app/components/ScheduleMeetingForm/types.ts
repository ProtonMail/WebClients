export interface FormValues {
    meetingName: string;
    startDate: Date;
    startTime: string;
    endDate: Date;
    endTime: string;
    timeZone: string;
    customPassword: string;
    recurrence: string;
}

export type OnDateTimeChange = (params: { fieldName: string; value: Date | string | undefined }) => void;
