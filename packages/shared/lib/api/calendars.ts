import { RequireSome } from '../interfaces/utils';
import { PaginationParams } from './interface';
import { Attendee, Calendar, CalendarEventData, CalendarSettings, CalendarUserSettings } from '../interfaces/calendar';

const CALENDAR_V1 = 'calendar/v1';

export const queryCalendars = (params?: PaginationParams) => ({
    url: `${CALENDAR_V1}`,
    method: 'get',
    params,
});

export type CalendarCreateData = Omit<Calendar, 'Flags' | 'ID'>;
export interface CalendarCreateArguments extends CalendarCreateData {
    AddressID: string;
}
export const createCalendar = (data: CalendarCreateArguments) => ({
    url: `${CALENDAR_V1}`,
    method: 'post',
    data,
});

interface CalendarSetupData {
    AddressID: string;
    Signature: string;
    PrivateKey: string;
    Passphrase: {
        DataPacket: string;
        KeyPackets: string;
    };
}
export const setupCalendar = (calendarID: string, data: CalendarSetupData) => ({
    url: `${CALENDAR_V1}/${calendarID}/keys`,
    method: 'post',
    data,
});

export const getCalendar = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}`,
    method: 'get',
});

export const getFullCalendar = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/bootstrap`,
    method: 'get',
});

export const getCalendarKeys = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/keys`,
    method: 'get',
});

export const getAllCalendarKeys = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/keys/all`,
    method: 'get',
});

export const getPassphrases = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/passphrases`,
    method: 'get',
});

export const getPassphrase = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/passphrase`,
    method: 'get',
});

export const reactivateCalendarKey = (calendarID: string, keyID: string, data: { PrivateKey: string }) => ({
    url: `${CALENDAR_V1}/${calendarID}/keys/${keyID}`,
    method: 'put',
    data,
});

export const getCalendarGroupReset = () => ({
    url: `${CALENDAR_V1}/keys/reset`,
    method: 'get',
});

interface CalendarKeysResetData {
    [calendarID: string]: CalendarSetupData;
}
export const resetCalendarGroup = (data: { CalendarKeys: CalendarKeysResetData }) => ({
    url: `${CALENDAR_V1}/keys/reset`,
    method: 'post',
    data,
});

export const updateCalendar = (calendarID: string, data: Partial<CalendarCreateData>) => ({
    url: `${CALENDAR_V1}/${calendarID}`,
    method: 'put',
    data,
});

export const removeCalendar = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}`,
    method: 'delete',
});

export const queryMembers = (calendarID: string, params?: PaginationParams) => ({
    url: `${CALENDAR_V1}/${calendarID}/members`,
    method: 'get',
    params,
});

export const getAllMembers = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/members/all`,
    method: 'get',
});

interface CalendarMemberData {
    Email: string;
    PassphraseKeyPacket: string;
    Permissions: number;
}
export const addMember = (calendarID: string, data: { Members: CalendarMemberData[] }) => ({
    url: `${CALENDAR_V1}/${calendarID}`,
    method: 'post',
    data,
});

export const updateMember = (calendarID: string, memberID: string, data: { Member: Partial<CalendarMemberData> }) => ({
    url: `${CALENDAR_V1}/${calendarID}/members/${memberID}`,
    method: 'put',
    data,
});

export const removeMember = (calendarID: string, memberID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/members/${memberID}`,
    method: 'delete',
});

export enum CalendarEventsQueryType {
    PartDayInsideWindow = 0,
    PartDayBeforeWindow = 1,
    FullDayInsideWindow = 2,
    FullDayBeforeWindow = 3,
}

interface CalendarEventsQuery extends PaginationParams {
    Start: number;
    End: number;
    Timezone: string;
    Type: CalendarEventsQueryType;
}
export const queryEvents = (calendarID: string, params: CalendarEventsQuery) => ({
    url: `${CALENDAR_V1}/${calendarID}/events`,
    method: 'get',
    params,
});

export const getEvent = (calendarID: string, eventID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}`,
    method: 'get',
});

export interface GetEventByUIDArguments extends Partial<PaginationParams> {
    UID: string;
    RecurrenceID?: number;
}
export const getEventByUID = (params: GetEventByUIDArguments) => ({
    url: `${CALENDAR_V1}/events`,
    method: 'get',
    params,
});

export interface CreateCalendarEventBlobData {
    CalendarKeyPacket?: string;
    CalendarEventContent?: Omit<CalendarEventData, 'Author'>[];
    SharedKeyPacket?: string;
    SharedEventContent: Omit<CalendarEventData, 'Author'>[];
    PersonalEventContent?: Omit<CalendarEventData, 'Author'>;
    AttendeesEventContent?: Omit<CalendarEventData, 'Author'>[];
    Attendees?: Omit<Attendee, 'UpdateTime' | 'ID'>[];
}
export interface CreateCalendarEventData extends CreateCalendarEventBlobData {
    Permissions: number;
    IsOrganizer?: 0 | 1;
}
export interface CreateSingleCalendarEventData extends CreateCalendarEventData {
    MemberID: string;
}
export interface CreateLinkedCalendarEventData
    extends RequireSome<Partial<CreateCalendarEventData>, 'SharedKeyPacket'> {
    UID: string;
    SharedEventID: string;
}
export const createEvent = (calendarID: string, data: CreateSingleCalendarEventData) => ({
    url: `${CALENDAR_V1}/${calendarID}/events`,
    method: 'post',
    data,
});

export const updateEvent = (calendarID: string, eventID: string, data: CreateSingleCalendarEventData) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}`,
    method: 'put',
    data,
});

export const deleteEvent = (calendarID: string, eventID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}`,
    method: 'delete',
});

export const updateAttendeePartstat = (
    calendarID: string,
    eventID: string,
    attendeeID: string,
    data: Pick<Attendee, 'Status' | 'UpdateTime'>
) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/attendees/${attendeeID}`,
    method: 'put',
    data,
});

export const acceptInvite = (uid: string, data: { Signature: string }) => ({
    url: `${CALENDAR_V1}/events/${uid}/accept`,
    method: 'put',
    data,
});

export const getCalendarSettings = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/settings`,
    method: 'get',
});

export const updateCalendarSettings = (calendarID: string, data: Partial<CalendarSettings>) => ({
    url: `${CALENDAR_V1}/${calendarID}/settings`,
    method: 'put',
    data,
});

export const getCalendarUserSettings = () => ({
    url: 'settings/calendar',
    method: 'get',
});

export const updateCalendarUserSettings = (data: Partial<CalendarUserSettings>) => ({
    url: 'settings/calendar',
    method: 'put',
    data,
});

export const getVtimezones = (Timezones: string[]) => ({
    // params doesn't work correctly so
    url: `${CALENDAR_V1}/vtimezones?${Timezones.map((tzid) => `Timezones[]=${tzid}`).join('&')}`,
    method: 'get',
    // params: { Timezones }
});

interface QueryCalendarAlarms {
    Start: number;
    End: number;
    PageSize: number;
}
export const queryCalendarAlarms = (calendarID: string, params: QueryCalendarAlarms) => ({
    url: `${CALENDAR_V1}/${calendarID}/alarms`,
    method: 'get',
    params,
});

export const getCalendarAlarm = (calendarID: string, alarmID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/alarms/${alarmID}`,
    method: 'get',
});

export interface CreateCalendarEventSyncData {
    Overwrite: 0 | 1;
    Event: CreateCalendarEventData;
}
export interface DeleteCalendarEventSyncData {
    ID: string;
}
export interface UpdateCalendarEventSyncData {
    ID: string;
    Event?: Omit<CreateCalendarEventData, 'SharedKeyPacket' | 'CalendarKeyPacket'>;
}
export interface CreateLinkedCalendarEventsSyncData {
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
export const syncMultipleEvents = (calendarID: string, data: SyncMultipleEventsData) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/sync`,
    method: 'put',
    data,
});
