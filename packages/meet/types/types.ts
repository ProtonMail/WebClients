import type { MeetingType } from '@proton/shared/lib/interfaces/Meet';

export interface CreateMeetingParams {
    meetingName: string;
    startTime?: string | null;
    endTime?: string | null;
    recurrence?: string | null;
    timeZone?: string | null;
    customPassword?: string;
    type?: MeetingType;
}
