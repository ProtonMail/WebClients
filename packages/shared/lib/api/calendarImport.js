// Manage imports of user calendars and events from external providers
export const createCalendarImport = (data) => ({
    url: 'calendar/v1/importers',
    method: 'post',
    data,
});

export const startCalendarImportJob = (importID, data) => ({
    url: `calendar/v1/importers/${importID}`,
    method: 'post',
    data,
});
