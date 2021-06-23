import { queryEvents } from 'proton-shared/lib/api/calendars';
import { Api } from 'proton-shared/lib/interfaces';
import paginatedFetch from 'proton-shared/lib/api/helpers/paginatedFetch';
import { CalendarEventWithMetadata } from 'proton-shared/lib/interfaces/calendar';

const getAllEventsByUID = async (api: Api, calendarID: string, UID: string, RecurrenceID?: number) => {
    return paginatedFetch(api, async (Page, PageSize) => {
        const { Events = [] } = await api<{ Events: CalendarEventWithMetadata[] }>({
            ...queryEvents(calendarID, { UID, RecurrenceID, PageSize, Page }),
            silence: true,
        });
        return Events;
    });
};

export default getAllEventsByUID;
