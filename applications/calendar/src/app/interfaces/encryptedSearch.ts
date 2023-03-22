import { EncryptedSearchFunctions } from '@proton/encrypted-search';
import { AttendeeModel, CalendarEventMetadata, CalendarEventSharedData } from '@proton/shared/lib/interfaces/calendar';

export interface ESAttendeeModel extends Pick<AttendeeModel, 'email' | 'cn' | 'role' | 'partstat'> {}

export interface ESCalendarMetadata extends CalendarEventSharedData, CalendarEventMetadata {
    Order: number;
    Summary: string;
    Location: string;
    Description: string;
    Attendees: ESAttendeeModel[];
}
export interface ESCalendarSearchParams {
    normalizedKeywords?: string[];
    calendarID?: string;
    begin?: number;
    end?: number;
}

export type MetadataRecoveryPoint = string[];

export type EncryptedSearchFunctionsCalendar = EncryptedSearchFunctions<ESCalendarMetadata, ESCalendarSearchParams>;
