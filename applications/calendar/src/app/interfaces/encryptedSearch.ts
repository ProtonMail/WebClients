import type { ESCalendarSearchParams, EncryptedSearchFunctions } from '@proton/encrypted-search/models';
import type {
    AttendeeModel,
    CalendarEventMetadata,
    CalendarEventSharedData,
    OrganizerModel,
    VcalAttendeeProperty,
    VcalOrganizerProperty,
} from '@proton/shared/lib/interfaces/calendar';

export interface ESOrganizerModel extends Pick<OrganizerModel, 'email' | 'cn'> {}
export interface ESAttendeeModel extends Pick<AttendeeModel, 'email' | 'cn' | 'role' | 'partstat'> {}

export interface ESCalendarMetadata extends CalendarEventSharedData, CalendarEventMetadata {
    Status: string;
    Order: number;
    Summary: string;
    Location: string;
    Description: string;
    Attendees: VcalAttendeeProperty[];
    Organizer?: VcalOrganizerProperty;
    IsDecryptable: boolean;
}

export interface ESCalendarContent {}

/**
 * @var remainingCalendarIDs the calendars for which indexation has not been done yet
 * @var currentCalendarId the calendar for which indexation is currently ongoing. Can be undefined when there no calendar left to be indexed
 * @var eventCursor the cursor fetched during last query. Can be undefined when starting to index event from a new calendar
 */
export type MetadataRecoveryPoint = {
    remainingCalendarIDs: string[];
    currentCalendarId?: string;
    eventCursor?: string;
};

export type EncryptedSearchFunctionsCalendar = EncryptedSearchFunctions<
    ESCalendarMetadata,
    ESCalendarSearchParams,
    ESCalendarContent
>;
