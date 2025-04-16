import { CALENDAR_VALIDATION_MODE } from '../calendar/constants';
import type {
    Attendee,
    CalendarNotificationSettings,
    CalendarSettings,
    CalendarUserSettings,
} from '../interfaces/calendar';
import {
    CALENDAR_ORDER_BY,
    CALENDAR_RETURN_FLAGS,
    type CalendarCreateArguments,
    type CalendarCreateOrUpdateEventBlobData,
    type CalendarEventsIDsQuery,
    type CalendarEventsQuery,
    type CalendarExportEventsQuery,
    type CalendarKeysResetData,
    type CalendarSetupData,
    type CreateCalendarMemberData,
    type CreatePublicLinks,
    type CreateSinglePersonalEventData,
    type GetBusySlotsParams,
    type GetEventByUIDArguments,
    type QueryCalendarAlarms,
    type SyncMultipleEventsData,
    type UpdateCalendarInviteData,
    type UpdateCalendarMemberData,
    VIDEO_CONFERENCE_PROVIDER,
} from '../interfaces/calendar/Api';
import type { Nullable, RequireOnly } from '../interfaces/utils';
import type { PaginationParams } from './interface';

const CALENDAR_V1 = 'calendar/v1';
const CALENDAR_V2 = 'calendar/v2';

export const queryLatestModelEventID = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/modelevents/latest`,
    method: 'get',
});

export const queryModelEvents = (calendarID: string, eventID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/modelevents/${eventID}`,
    method: 'get',
});

export const queryCalendars = (OrderBy = CALENDAR_ORDER_BY.ASCENDING, ReturnFlags = CALENDAR_RETURN_FLAGS.YES) => ({
    url: `${CALENDAR_V1}`,
    method: 'get',
    params: { OrderBy, ReturnFlags },
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
    url: `${CALENDAR_V2}/${calendarID}/bootstrap`,
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

export const resetCalendars = (data: { CalendarKeys: CalendarKeysResetData }) => ({
    url: `${CALENDAR_V1}/keys/reset`,
    method: 'post',
    data,
});

export const removeCalendar = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}`,
    method: 'delete',
});

export const removeHolidaysCalendar = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/managed`,
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

export const getCalendarInvitations = (calendarID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations`,
    method: 'get',
});

export const getAllInvitations = () => ({
    url: `${CALENDAR_V1}/invitations`,
    method: 'get',
});

export const addMember = (
    calendarID: string,
    data: { AddressID: string; Signature: string; Members: CreateCalendarMemberData[] }
) => ({
    url: `${CALENDAR_V1}/${calendarID}/members`,
    method: 'post',
    data,
});

export const updateMember = (calendarID: string, memberID: string, data: Partial<UpdateCalendarMemberData>) => ({
    url: `${CALENDAR_V1}/${calendarID}/members/${memberID}`,
    method: 'put',
    data,
});

export const updateMemberPermission = (
    calendarID: string,
    memberID: string,
    data: RequireOnly<Pick<UpdateCalendarMemberData, 'Permissions' | 'PassphraseKeyPacket'>, 'Permissions'>
) => ({
    url: `${CALENDAR_V1}/${calendarID}/members/${memberID}/permission`,
    method: 'put',
    data,
});

export const updateInvitation = (
    calendarID: string,
    invitationID: string,
    data: Partial<UpdateCalendarInviteData>
) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations/${invitationID}`,
    method: 'put',
    data,
});

export const removeMember = (calendarID: string, memberID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/members/${memberID}`,
    method: 'delete',
});

export const getInvitation = (calendarID: string, invitationID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations/${invitationID}`,
    method: 'get',
});

export const removeInvitation = (calendarID: string, invitationID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations/${invitationID}`,
    method: 'delete',
});

export const acceptInvitation = (calendarID: string, addressID: string, data: { Signature: string }) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations/${addressID}/accept`,
    method: 'put',
    data,
});

export const rejectInvitation = (calendarID: string, addressID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations/${addressID}/reject`,
    method: 'put',
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

export const queryEventsIDs = (calendarID: string, params: CalendarEventsIDsQuery) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/ids`,
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

export const deleteEvent = (calendarID: string, eventID: string) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}`,
    method: 'delete',
});

export const updatePersonalEventPart = (calendarID: string, eventID: string, data: CreateSinglePersonalEventData) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/personal`,
    method: 'put',
    data,
});

export const getPaginatedAttendeesInfo = (calendarID: string, eventID: string, Page = 0) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/attendees`,
    method: 'get',
    params: { Page },
});

export const updateAttendeePartstat = (
    calendarID: string,
    eventID: string,
    attendeeID: string,
    data: Pick<Attendee, 'Status' | 'UpdateTime' | 'Comment'>
) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/attendees/${attendeeID}`,
    method: 'put',
    data,
});

export const attendeeDeleteSingleEdit = (
    calendarID: string,
    eventID: string,
    data: Pick<CalendarCreateOrUpdateEventBlobData, 'CalendarEventContent'>
) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/attendee_delete_single_edit`,
    method: 'put',
    data,
});

export const upgradeP2PInvite = (
    calendarID: string,
    eventID: string,
    data: Pick<CalendarCreateOrUpdateEventBlobData, 'SharedKeyPacket'>
) => ({
    url: `${CALENDAR_V1}/${calendarID}/events/${eventID}/upgrade`,
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

export const getAllowedTimeZones = () => ({
    url: `${CALENDAR_V1}/timezones`,
    method: 'get',
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

export const validateSubscription = ({
    url: URL,
    mode: Mode = CALENDAR_VALIDATION_MODE.DOWNLOAD_AND_PARSE,
}: {
    url: string;
    mode?: CALENDAR_VALIDATION_MODE;
}) => ({
    url: `${CALENDAR_V1}/subscription/validate`,
    method: 'post',
    data: { URL, Mode },
});

export const getDirectoryCalendars = (type: number) => ({
    url: `${CALENDAR_V1}/directory?Type=${type}`,
    method: 'get',
});

export const joinHolidaysCalendar = (
    calendarID: string,
    addressID: string,
    data: {
        PassphraseKeyPacket: string;
        Signature: string;
        Color: string;
        DefaultFullDayNotifications: CalendarNotificationSettings[];
        Priority?: number;
    }
) => ({
    url: `${CALENDAR_V1}/${calendarID}/invitations/${addressID}/join`,
    method: 'post',
    data,
});

export const getBusySlots = (emailAddress: string, params: GetBusySlotsParams) => ({
    url: `${CALENDAR_V1}/${emailAddress}/busy-schedule`,
    method: 'get',
    params,
});

/**
 * Only Zoom is supported for the moment
 */
export const createZoomMeeting = () => ({
    url: `${CALENDAR_V1}/videoconferences`,
    method: 'post',
    data: { Provider: VIDEO_CONFERENCE_PROVIDER.ZOOM },
});
