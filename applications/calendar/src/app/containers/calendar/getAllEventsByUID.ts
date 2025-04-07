import { queryEvents } from '@proton/shared/lib/api/calendars';
import paginatedFetch from '@proton/shared/lib/api/helpers/paginatedFetch';
import type { Api } from '@proton/shared/lib/interfaces';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

const getAllEventsByUID = async (api: Api, calendarID: string, UID: string, RecurrenceID?: number) => {
    // TODO fetch paginated attendees there
    return paginatedFetch(api, async (Page, PageSize) => {
        const { Events = [] } = await api<{ Events: CalendarEvent[] }>({
            ...queryEvents(calendarID, { UID, RecurrenceID, PageSize, Page }),
            silence: true,
        });
        return Events;
    });
};

export default getAllEventsByUID;
