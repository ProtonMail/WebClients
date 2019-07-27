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
    url: `calendar/${calendarID}/keys`,
    method: 'post',
    data
});

export const getCalendar = (calendarID) => ({
    url: `calendar/${calendarID}`,
    method: 'get'
});

export const getFullCalendar = (calendarID) => ({
    url: `calendar/${calendarID}/bootstrap`,
    method: 'get'
});

export const getCalendarKeys = (calendarID) => ({
    url: `calendar/${calendarID}/keys`,
    method: 'get'
});

export const getAllCalendarKeys = (calendarID) => ({
    url: `calendar/${calendarID}/keys/all`,
    method: 'get'
});

export const getPassphrases = (calendarID) => ({
    url: `calendar/${calendarID}/passphrases`,
    method: 'get'
});

export const getPassphrase = (calendarID) => ({
    url: `calendar/${calendarID}/passphrase`,
    method: 'get'
});

export const reactivateCalendarKey = (calendarID, keyID, data) => ({
    url: `calendar/${calendarID}/keys/${keyID}`,
    method: 'put',
    data
});

export const pinPassphrase = (calendarID, eaid, data) => ({
    url: `calendar/${calendarID}/passphrase/members/${eaid}`,
    method: 'put',
    data
});

export const updateCalendar = (calendarID, data) => ({
    url: `calendar/${calendarID}`,
    method: 'put',
    data
});

export const removeCalendar = (calendarID) => ({
    url: `calendar/${calendarID}`,
    method: 'delete'
});

export const addMember = (calendarID, data) => ({
    url: `calendar/${calendarID}`,
    method: 'post',
    data
});

export const updateMember = (calendarID, memberID, data) => ({
    url: `calendar/${calendarID}/members/${memberID}`,
    method: 'put',
    data
});

export const removeMember = (calendarID, memberID) => ({
    url: `calendar/${calendarID}/members/${memberID}`,
    method: 'delete'
});

export const createEvent = (calendarID, data) => ({
    url: `calendar/${calendarID}/events`,
    method: 'post',
    data
});

export const queryEvents = (calendarID, params) => ({
    url: `calendar/${calendarID}/events`,
    method: 'get',
    params
});

export const getEvent = (calendarID, eventID) => ({
    url: `calendar/${calendarID}/events/${eventID}`,
    method: 'get'
});

export const getEventHistory = (calendarID, eventID, params) => ({
    url: `calendar/${calendarID}/events/${eventID}/history`,
    method: 'get',
    params
});

export const updateEvent = (calendarID, eventID, data) => ({
    url: `calendar/${calendarID}/events/${eventID}`,
    method: 'put',
    data
});

export const getAttendees = (calendarID, eventID) => ({
    url: `calendar/${calendarID}/events/${eventID}/attendees`,
    method: 'get'
});

export const addAttendee = (calendarID, eventID, data) => ({
    url: `calendar/${calendarID}/events/${eventID}/attendees`,
    method: 'post',
    data
});

export const removeAttendee = (calendarID, eventID, attendeeID) => ({
    url: `calendar/${calendarID}/events/${eventID}/attendees/${attendeeID}`,
    method: 'delete'
});

export const updateAttendee = (calendarID, eventID, attendeeID, data) => ({
    url: `calendar/${calendarID}/events/${eventID}/attendees/${attendeeID}`,
    method: 'put',
    data
});

export const updateInvite = (uid, params) => ({
    url: `calendars/events/${uid}/accept`,
    method: 'get',
    params
});

export const getCalendarSettings = (calendarID) => ({
    url: `calendar/${calendarID}/settings`,
    method: 'get'
});

export const updateCalendarSettings = (calendarID, data) => ({
    url: `calendar/${calendarID}/settings`,
    method: 'put',
    data
});

export const getUserSettings = () => ({
    url: 'calendar/settings',
    method: 'get'
});

export const updateUserSettings = (data) => ({
    url: 'calendar/settings',
    method: 'put',
    data
});
