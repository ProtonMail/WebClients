import parseMainEventData from './event/parseMainEventData';
import { getUnixTime } from 'date-fns';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { queryEvents } from 'proton-shared/lib/api/calendars';
import { Api } from 'proton-shared/lib/interfaces';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';

const MAX_FETCH_ITERATIONS = 10;

const parseNextPaginationStart = (data: CalendarEvent) => {
    const component = parseMainEventData(data);
    if (!component) {
        return;
    }
    const { dtstart } = component;
    return getUnixTime(propertyToUTCDate(dtstart));
};

const getPaginatedEvents = async (api: Api, calendarID: string, dateRange: Date[], tzid: string) => {
    let results: CalendarEvent[] = [];

    const PageSize = 100;

    const params = {
        // Special case, not using our boundaries, since the API does not accept negative values.
        End: Math.max(0, getUnixTime(dateRange[1])),
        Timezone: tzid,
        PageSize,
        Page: 0
    };

    let lastStart: number | undefined = Math.max(0, getUnixTime(dateRange[0]));
    let iterations = 0;

    while (lastStart !== undefined && iterations < MAX_FETCH_ITERATIONS) {
        // https://github.com/microsoft/TypeScript/issues/36687
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        const { Events = [] } = await api<{ Events: CalendarEvent[] }>(
            queryEvents(calendarID, { ...params, Start: lastStart })
        );
        const lastEvent = Events.length > 0 ? Events[Events.length - 1] : undefined;
        results = results.concat(Events);
        lastStart = Events.length === PageSize && lastEvent ? parseNextPaginationStart(lastEvent) : undefined;
        iterations++;
    }

    return results;
};

export default getPaginatedEvents;
