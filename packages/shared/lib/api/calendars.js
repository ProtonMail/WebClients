export const queryCalendars = (params) => ({
    url: 'calendars',
    method: 'get',
    params
});

export const createCalendar = (data) => ({
    url: 'calendars',
    method: 'post',
    data
});

export const setupCalendar = (calendarID, data) => ({
    url: `calendars/${calendarID}/keys`,
    method: 'post',
    data
});

export const getCalendar = (calendarID) => ({
    url: `calendars/${calendarID}`,
    method: 'get'
});

export const getFullCalendar = (calendarID) => ({
    url: `calendars/${calendarID}/bootstrap`,
    method: 'get'
});

export const getCalendarKeys = (calendarID) => ({
    url: `calendars/${calendarID}/keys`,
    method: 'get'
});

export const getAllCalendarKeys = (calendarID) => ({
    url: `calendars/${calendarID}/keys/all`,
    method: 'get'
});

export const getPassphrases = (calendarID) => ({
    url: `calendars/${calendarID}/passphrases`,
    method: 'get'
});

export const getPassphrase = (calendarID) => ({
    url: `calendars/${calendarID}/passphrase`,
    method: 'get'
});

export const reactivateCalendarKey = (calendarID, keyID, data) => ({
    url: `calendars/${calendarID}/keys/${keyID}`,
    method: 'put',
    data
});

export const getCalendarGroupReset = () => ({
    url: 'calendars/keys/reset',
    method: 'get'
});

export const resetCalendarGroup = (data) => ({
    url: 'calendars/keys/reset',
    method: 'post',
    data
});

export const pinPassphrase = (calendarID, eaid, data) => ({
    url: `calendars/${calendarID}/passphrase/members/${eaid}`,
    method: 'put',
    data
});

export const updateCalendar = (calendarID, data) => ({
    url: `calendars/${calendarID}`,
    method: 'put',
    data
});

export const removeCalendar = (calendarID) => ({
    url: `calendars/${calendarID}`,
    method: 'delete'
});

export const queryMembers = (calendarID, params) => ({
    url: `calendars/${calendarID}/members`,
    method: 'get',
    params
});

export const getAllMembers = (calendarID) => ({
    url: `calendars/${calendarID}/members/all`,
    method: 'get'
});

export const addMember = (calendarID, data) => ({
    url: `calendars/${calendarID}`,
    method: 'post',
    data
});

export const updateMember = (calendarID, memberID, data) => ({
    url: `calendars/${calendarID}/members/${memberID}`,
    method: 'put',
    data
});

export const removeMember = (calendarID, memberID) => ({
    url: `calendars/${calendarID}/members/${memberID}`,
    method: 'delete'
});

export const createEvent = (calendarID, data) => ({
    url: `calendars/${calendarID}/events`,
    method: 'post',
    data
});

export const queryEvents = (calendarID, params) => ({
    url: `calendars/${calendarID}/events`,
    method: 'get',
    params
});

export const getEvent = (calendarID, eventID) => ({
    url: `calendars/${calendarID}/events/${eventID}`,
    method: 'get'
});

export const getEventHistory = (calendarID, eventID, params) => ({
    url: `calendars/${calendarID}/events/${eventID}/history`,
    method: 'get',
    params
});

export const updateEvent = (calendarID, eventID, data) => ({
    url: `calendars/${calendarID}/events/${eventID}`,
    method: 'put',
    data
});

export const deleteEvent = (calendarID, eventID) => ({
    url: `calendars/${calendarID}/events/${eventID}`,
    method: 'delete'
});

export const getAttendees = (calendarID, eventID) => ({
    url: `calendars/${calendarID}/events/${eventID}/attendees`,
    method: 'get'
});

export const addAttendee = (calendarID, eventID, data) => ({
    url: `calendars/${calendarID}/events/${eventID}/attendees`,
    method: 'post',
    data
});

export const removeAttendee = (calendarID, eventID, attendeeID) => ({
    url: `calendars/${calendarID}/events/${eventID}/attendees/${attendeeID}`,
    method: 'delete'
});

export const updateAttendee = (calendarID, eventID, attendeeID, data) => ({
    url: `calendars/${calendarID}/events/${eventID}/attendees/${attendeeID}`,
    method: 'put',
    data
});

export const updateInvite = (uid, params) => ({
    url: `calendars/events/${uid}/accept`,
    method: 'get',
    params
});

export const getCalendarSettings = (calendarID) => ({
    url: `calendars/${calendarID}/settings`,
    method: 'get'
});

export const updateCalendarSettings = (calendarID, data) => ({
    url: `calendars/${calendarID}/settings`,
    method: 'put',
    data
});

export const getCalendarUserSettings = () => ({
    url: 'settings/calendar',
    method: 'get'
});

export const updateCalendarUserSettings = (data) => ({
    url: 'settings/calendar',
    method: 'put',
    data
});

export const getEventsOccurrences = (calendarID, year, params) => ({
    url: `calendars/${calendarID}/events/year/${year}`,
    method: 'get',
    params
});

export const queryCalendarAlarms = (calendarID, params) => ({
    url: `calendars/${calendarID}/alarms`,
    method: 'get',
    params
});

export const getCalendarAlarm = (calendarID, alarmID) => ({
    url: `calendars/${calendarID}/alarms/${alarmID}`,
    method: 'get'
});
