import { getEventByUID as getEventByUIDRoute } from 'proton-shared/lib/api/calendars';
import { Api } from 'proton-shared/lib/interfaces';
import paginatedFetch from 'proton-shared/lib/api/helpers/paginatedFetch';
import { CalendarEventWithMetadata } from 'proton-shared/lib/interfaces/calendar';

const getAllEventsByUID = async (api: Api, UID: string, CalendarID: string) => {
    return paginatedFetch(api, async (Page, PageSize) => {
        const { Events = [] } = await api<{ Events: CalendarEventWithMetadata[] }>({
            ...getEventByUIDRoute({ UID, PageSize, Page }),
            silence: true,
        });
        return Events.filter((event) => event.CalendarID === CalendarID);
    });
};

export default getAllEventsByUID;
