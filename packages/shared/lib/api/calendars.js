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

export const getCalendarKeys = (calendarID) => ({
    url: `calendars/${calendarID}/keys`,
    method: 'get'
});

export const updateCalendar = (calendarID, data) => ({
    url: `calendars/${calendarID}`,
    method: 'put',
    data
});
