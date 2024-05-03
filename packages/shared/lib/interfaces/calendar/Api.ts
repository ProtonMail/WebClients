import { PaginationParams } from '../../api/interface';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from '../../calendar/constants';
import { ApiResponse } from '../Api';
import { Nullable, RequireSome } from '../utils';
import { CalendarNotificationSettings, CalendarSettings } from './Calendar';
import { CalendarKey, CalendarPassphrase } from './CalendarKey';
import { CalendarMember, CalendarMemberInvitation } from './CalendarMember';
import { Attendee, CalendarEvent, CalendarEventData } from './Event';
import { ACCESS_LEVEL } from './Link';

export type CalendarCreateData = {
    Name: string;
    Description: string;
    Color: string;
    Display: CALENDAR_DISPLAY;
    URL?: string;
};

export enum DELETION_REASON {
    NORMAL = 0,
    CHANGE_CALENDAR = 1,
}

export interface CalendarCreateArguments extends CalendarCreateData {
    IsImport?: 0 | 1;
    AddressID: string;
}

export interface CalendarSetupData {
    AddressID: string;
    Signature: string;
    PrivateKey: string;
    Passphrase: {
        DataPacket: string;
        KeyPacket: string;
    };
}

export interface CalendarSetupResponse extends ApiResponse {
    Key: CalendarKey;
    Passphrase: CalendarPassphrase;
}

export interface CreateOrResetCalendarPayload {
    AddressID: string;
    Signature: string;
    PrivateKey: string;
    Passphrase: {
        DataPacket: string;
        KeyPacket: string;
    };
}

export interface CalendarKeysResetData {
    [calendarID: string]: CalendarSetupData;
}

export interface CreateCalendarMemberData {
    Email: string;
    PassphraseKeyPacket: string;
    Permissions: number;
}

export interface UpdateCalendarMemberData {
    Permissions: number;
    PassphraseKeyPacket: string;
    Name: string;
    Description: string;
    Color: string;
    Display: CALENDAR_DISPLAY;
}

export interface UpdateCalendarInviteData {
    Permissions: number;
}

export enum CalendarEventsQueryType {
    PartDayInsideWindow = 0,
    PartDayBeforeWindow = 1,
    FullDayInsideWindow = 2,
    FullDayBeforeWindow = 3,
}

export interface CalendarEventsQuery extends PaginationParams {
    Start: number;
    End: number;
    Timezone: string;
    Type: CalendarEventsQueryType;
    MetaDataOnly?: 0 | 1; // default is 0
}

export interface CalendarEventsIDsQuery {
    Limit?: number;
    AfterID?: string;
}

export interface CalendarExportEventsQuery extends PaginationParams {
    BeginID?: string;
}

export interface GetEventByUIDArguments extends Partial<PaginationParams> {
    UID: string;
    RecurrenceID?: number;
    CalendarType?: CALENDAR_TYPE;
}

export interface CalendarCreateOrUpdateEventBlobData {
    CalendarKeyPacket?: string;
    CalendarEventContent?: Omit<CalendarEventData, 'Author'>[];
    SharedKeyPacket?: string;
    SharedEventContent?: Omit<CalendarEventData, 'Author'>[];
    Notifications: Nullable<CalendarNotificationSettings[]>;
    Color: Nullable<string>;
    AttendeesEventContent?: Omit<CalendarEventData, 'Author'>[];
    Attendees?: Omit<Attendee, 'UpdateTime' | 'ID'>[];
    CancelledOccurrenceContent?: Omit<CalendarEventData, 'Author'>[];
}
export type CalendarCreateEventBlobData = RequireSome<
    CalendarCreateOrUpdateEventBlobData,
    'SharedEventContent' | 'SharedKeyPacket'
>;

interface CalendarCreateOrUpdateEventMetaData {
    Permissions: number;
    IsOrganizer?: 0 | 1;
    IsPersonalSingleEdit?: boolean;
    RemovedAttendeeAddresses?: string[];
    AddedProtonAttendees?: {
        Email: string;
        AddressKeyPacket: string;
    }[];
}

export interface CreateOrUpdateCalendarEventData
    extends CalendarCreateOrUpdateEventBlobData,
        CalendarCreateOrUpdateEventMetaData {}
export interface CreateSinglePersonalEventData {
    Notifications: Nullable<CalendarNotificationSettings[]>;
    Color: Nullable<string>;
}

export interface CreateLinkedCalendarEventData
    extends RequireSome<Partial<CreateOrUpdateCalendarEventData>, 'SharedKeyPacket'> {
    UID: string;
    SharedEventID: string;
    SourceCalendarID?: string;
}

export interface QueryCalendarAlarms {
    Start: number;
    End: number;
    PageSize: number;
}

export interface CreateCalendarEventSyncData {
    Overwrite?: 0 | 1;
    Event: CreateOrUpdateCalendarEventData;
}

export interface DeleteCalendarEventSyncData {
    ID: string;
    DeletionReason?: DELETION_REASON;
}

export interface UpdateCalendarEventSyncData {
    ID: string;
    Event?: Omit<CreateOrUpdateCalendarEventData, 'SharedKeyPacket' | 'CalendarKeyPacket'>;
}

export interface CreateLinkedCalendarEventsSyncData {
    Overwrite?: 0 | 1;
    Event: CreateLinkedCalendarEventData;
}

export interface SyncMultipleEventsData {
    MemberID: string;
    IsImport?: 0 | 1;
    Events: (
        | CreateCalendarEventSyncData
        | CreateLinkedCalendarEventsSyncData
        | DeleteCalendarEventSyncData
        | UpdateCalendarEventSyncData
    )[];
}

export interface CreatePublicLinks {
    AccessLevel: ACCESS_LEVEL;
    CacheKeySalt: string;
    CacheKeyHash: string;
    EncryptedPassphrase: Nullable<string>;
    EncryptedPurpose: Nullable<string>;
    EncryptedCacheKey: string;
    PassphraseID: Nullable<string>;
}

export interface SyncMultipleApiResponses {
    Index: number;
    Response: {
        Code: number;
        Event?: CalendarEvent;
        Error?: string;
    };
}

export interface SyncMultipleApiResponse extends ApiResponse {
    Responses: SyncMultipleApiResponses[];
}

export interface UpdateEventPartApiResponse extends ApiResponse {
    Event: CalendarEvent;
}

export interface AttendeeDeleteSingleEditResponse extends ApiResponse {
    Event: CalendarEvent;
}

interface GetCanonicalAddressesSingleApiResponse extends ApiResponse {
    CanonicalEmail: string;
}

export interface GetCanonicalAddressesApiResponses {
    Email: string;
    Response: GetCanonicalAddressesSingleApiResponse;
}

export interface GetCanonicalAddressesApiResponse extends ApiResponse {
    Responses: GetCanonicalAddressesApiResponses[];
}

export interface GetAllMembersApiResponse {
    Members: CalendarMember[];
}

export interface GetCalendarInvitationsResponse {
    Invitations: CalendarMemberInvitation[];
}

export enum BUSY_TIME_SLOT_TYPE {
    /** Partial day: event's start time is inside the requested window */
    PARTIAL_DAY_IN = 0,
    /** Partial day: event's start time is before the requested window */
    PARTIAL_DAY_BEFORE = 1,
    /** Full day: event's start date is inside the requested window */
    FULL_DAY_IN = 2,
    /** Full day: event's start date is before the requested window */
    FULL_DAY_BEFORE = 3,
}

export interface GetBusySlotsParams {
    /** Min 0, Max 100. Defaults to 100 */
    PageSize?: number;
    /** 0 based index. Defaults to 0 */
    Page?: number;
    Type: BUSY_TIME_SLOT_TYPE;
    /** Unix timestamp */
    Start: number;
    /** Unix timestamp */
    End: number;
    /** The timezone currently used on the calendar, will impact which events are returned: "Timezone=Europe/Paris" */
    Timezone: string;
}

export interface GetBusySlotsResponse extends ApiResponse {
    BusySchedule: {
        IsDataAccessible: boolean;
        BusyTimeSlots: { Start: number; End: number }[] | null;
        More: boolean;
    };
}

/**
 * @warning Not fully typed
 */
export interface JoinHolidayCalendarResponse extends ApiResponse {
    Calendar: {
        ID: string;
        Type: CALENDAR_TYPE;
    };
    CalendarSettings: CalendarSettings;
}
