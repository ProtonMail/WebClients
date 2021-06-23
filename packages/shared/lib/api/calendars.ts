import { Attendee, CalendarSettings, CalendarUserSettings } from '../interfaces/calendar';
import {
    CalendarCreateArguments,
    CalendarCreateData,
    CalendarEventsQuery,
    CalendarExportEventsQuery,
    CalendarKeysResetData,
    CalendarMemberData,
    CalendarSetupData,
    CreatePublicLinks,
    CreateSingleCalendarEventData,
    CreateSinglePersonalEventData,
    GetEventByUIDArguments,
    QueryCalendarAlarms,
    SyncMultipleEventsData,
} from '../interfaces/calendar/Api';
import { Nullable } from '../interfaces/utils';
import { PaginationParams } from './interface';

const CALENDAR_V1 = 'calendar/v1';

export const queryLatestModelEventID = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/modelevents/latest`,
    method: 'get',
});

export const queryModelEvents = (calendarID: string, eventID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/modelevents/${eventID}`,
    method: 'get',
});

export const queryCalendars = () => ({
    url: `${CALENDAR_V1}`,
    method: 'get',
});

export const createCalendar = (data: CalendarCreateArguments) => ({
    url: `${CALENDAR_V1}`,
    method: 'post',
    data,
});

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

export const getEventsCount = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/count`,
    method: 'get',
});

export const queryEvents = (
    calendarID: string,
    params: CalendarEventsQuery | CalendarExportEventsQuery | GetEventByUIDArguments
) => ({
    url: `${CALENDAR_V1}/${calendarID}/events`,
    method: 'get',
    params,
});

export const getEvent = (calendarID: string, eventID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}`,
    method: 'get',
});

export const getEventByUID = (params: GetEventByUIDArguments) => ({
    url: `${CALENDAR_V1}/events`,
    method: 'get',
    params,
});

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

export const updatePersonalEventPart = (calendarID: string, eventID: string, data: CreateSinglePersonalEventData) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/personal`,
    method: 'put',
    data,
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

export const queryCalendarAlarms = (calendarID: string, params: QueryCalendarAlarms) => ({
    url: `${CALENDAR_V1}/${calendarID}/alarms`,
    method: 'get',
    params,
});

export const getCalendarAlarm = (calendarID: string, alarmID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/alarms/${alarmID}`,
    method: 'get',
});

export const syncMultipleEvents = (calendarID: string, data: SyncMultipleEventsData) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/sync`,
    method: 'put',
    data,
});

export const createPublicLink = (calendarID: string, data: CreatePublicLinks) => ({
    url: `${CALENDAR_V1}/${calendarID}/urls`,
    method: 'post',
    data,
});

export const getPublicLinks = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/urls`,
    method: 'get',
});

export const deletePublicLink = ({ calendarID, urlID }: { calendarID: string; urlID: string }) => ({
    url: `${CALENDAR_V1}/${calendarID}/urls/${urlID}`,
    method: 'delete',
});

export const editPublicLink = ({
    calendarID,
    urlID,
    encryptedPurpose,
}: {
    calendarID: string;
    urlID: string;
    encryptedPurpose: Nullable<string>;
}) => ({
    url: `${CALENDAR_V1}/${calendarID}/urls/${urlID}`,
    method: 'put',
    data: { EncryptedPurpose: encryptedPurpose },
});

export const getSubscriptionParameters = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/subscription`,
    method: 'get',
});
