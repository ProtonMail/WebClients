export const getCalendarSettings = () => ({
    url: 'settings/calendar',
    method: 'get'
});

export const updateCalendarSettings = (data) => ({
    url: 'settings/calendar',
    method: 'put',
    data
});
