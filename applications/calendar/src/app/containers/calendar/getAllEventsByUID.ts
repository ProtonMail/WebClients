import { queryEvents } from '@proton/shared/lib/api/calendars';
import paginatedFetch from '@proton/shared/lib/api/helpers/paginatedFetch';
import { Api } from '@proton/shared/lib/interfaces';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

const getAllEventsByUID = async (api: Api, calendarID: string, UID: string, RecurrenceID?: number) => {
    return paginatedFetch(api, async (Page, PageSize) => {
        const { Events = [] } = await api<{ Events: CalendarEvent[] }>({
            ...queryEvents(calendarID, { UID, RecurrenceID, PageSize, Page }),
            silence: true,
        });
        return Events;
    });
};

export default getAllEventsByUID;
