export interface AutoReplyFormDate {
    date?: Date;
    time?: Date;
    day?: number;
}

export interface AutoReplyFormModel {
    message: string;
    duration: number;
    daysOfWeek: number[];
    timezone: string;
    subject: string;
    enabled: boolean;
    start: AutoReplyFormDate;
    end: AutoReplyFormDate;
}
