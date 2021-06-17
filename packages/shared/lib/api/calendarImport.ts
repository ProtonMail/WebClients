// Manage imports of user calendars and events from external providers
export const createCalendarImport = (data: any) => ({
    url: 'calendar/v1/importers',
    method: 'post',
    data,
});

export const startCalendarImportJob = (importID: string, data: any) => ({
    url: `calendar/v1/importers/${importID}`,
    method: 'post',
    data,
});
