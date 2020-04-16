import { getEventByUID as getEventByUIDRoute } from 'proton-shared/lib/api/calendars';
import { Api } from 'proton-shared/lib/interfaces';
import paginatedFetch from 'proton-shared/lib/api/helpers/paginatedFetch';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';

const getAllEventsByUID = async (api: Api, UID: string) => {
    return paginatedFetch(api, async (PageNumber, PageSize) => {
        const { Events = [] } = await api<{ Events: CalendarEvent[] }>(
            getEventByUIDRoute({ UID, PageSize, PageNumber })
        );
        return Events;
    });
};

export default getAllEventsByUID;
