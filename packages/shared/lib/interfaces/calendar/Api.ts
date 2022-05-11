import { PaginationParams } from '../../api/interface';
import { ApiResponse } from '../Api';
import { Nullable, RequireSome } from '../utils';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from './Calendar';
import { CalendarMember, CalendarMemberInvitation } from './CalendarMember';
import { Attendee, CalendarEventData, CalendarEventWithMetadata } from './Event';
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
}

export interface CalendarExportEventsQuery extends PaginationParams {
    BeginID?: string;
}

export interface GetEventByUIDArguments extends Partial<PaginationParams> {
    UID: string;
    RecurrenceID?: number;
    CalendarType?: CALENDAR_TYPE;
}

export interface CalendarCreateEventBlobData {
    CalendarKeyPacket?: string;
    CalendarEventContent?: Omit<CalendarEventData, 'Author'>[];
    SharedKeyPacket?: string;
    SharedEventContent?: Omit<CalendarEventData, 'Author'>[];
    PersonalEventContent?: Omit<CalendarEventData, 'Author'>;
    AttendeesEventContent?: Omit<CalendarEventData, 'Author'>[];
    Attendees?: Omit<Attendee, 'UpdateTime' | 'ID'>[];
}

export interface CreateCalendarEventData
    extends RequireSome<CalendarCreateEventBlobData, 'SharedEventContent' | 'SharedKeyPacket'> {
    Permissions: number;
    IsOrganizer?: 0 | 1;
    RemovedAttendeeAddresses?: string[];
    AddedProtonAttendees?: {
        Email: string;
        AddressKeyPacket: string;
    }[];
}

export interface CreateSingleCalendarEventData extends CreateCalendarEventData {
    MemberID: string;
}

export interface CreateSinglePersonalEventData {
    MemberID: string;
    PersonalEventContent?: Omit<CalendarEventData, 'Author'>;
}

export interface CreateLinkedCalendarEventData
    extends RequireSome<Partial<CreateCalendarEventData>, 'SharedKeyPacket'> {
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
    Event: CreateCalendarEventData;
}

export interface DeleteCalendarEventSyncData {
    ID: string;
    DeletionReason?: DELETION_REASON;
}

export interface UpdateCalendarEventSyncData {
    ID: string;
    Event?: Omit<CreateCalendarEventData, 'SharedKeyPacket' | 'CalendarKeyPacket'>;
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
        Event?: CalendarEventWithMetadata;
        Error?: string;
    };
}

export interface SyncMultipleApiResponse extends ApiResponse {
    Responses: SyncMultipleApiResponses[];
}

export interface UpdateEventPartApiResponse extends ApiResponse {
    Event: CalendarEventWithMetadata;
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

export interface GetAllInvitationsApiResponse {
    Invitations: CalendarMemberInvitation[];
}
