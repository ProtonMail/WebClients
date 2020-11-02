import { getEventByUID } from '../../api/calendars';
import { Api } from '../../interfaces';
import { CalendarEventWithMetadata } from '../../interfaces/calendar';

const MAX_ITERATIONS = 100;

const getPaginatedEventsByUID = async ({
    api,
    uid,
    recurrenceID,
    max = MAX_ITERATIONS,
}: {
    api: Api;
    uid: string;
    recurrenceID?: number;
    max?: number;
}) => {
    const pageSize = 100;
    let pageNumber = 0;
    let result: CalendarEventWithMetadata[] = [];

    while (pageNumber < max) {
        const page = await api<{ Events: CalendarEventWithMetadata[] }>(
            getEventByUID({
                UID: uid,
                RecurrenceID: recurrenceID,
                Page: pageNumber,
                PageSize: pageSize,
            })
        );
        result = result.concat(page.Events);
        if (page.Events.length !== pageSize) {
            break;
        }
        pageNumber++;
    }

    return result;
};

export default getPaginatedEventsByUID;
