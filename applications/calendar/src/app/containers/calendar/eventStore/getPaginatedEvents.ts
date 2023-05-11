import { getUnixTime } from 'date-fns';

import { queryEvents } from '@proton/shared/lib/api/calendars';
import { booleanToNumber } from '@proton/shared/lib/helpers/boolean';
import { Api } from '@proton/shared/lib/interfaces';
import { CalendarEvent, CalendarEventWithoutBlob } from '@proton/shared/lib/interfaces/calendar';
import { CalendarEventsQueryType } from '@proton/shared/lib/interfaces/calendar/Api';

interface ApiResponse<T> {
    More: 0 | 1;
    Events: T[];
}

const PageSize = 100;
const QUERY_TYPES = [
    CalendarEventsQueryType.PartDayInsideWindow,
    CalendarEventsQueryType.PartDayBeforeWindow,
    CalendarEventsQueryType.FullDayInsideWindow,
    CalendarEventsQueryType.FullDayBeforeWindow,
];

interface GetPaginatedEventParams<T> {
    calendarID: string;
    dateRange: Date[];
    tzid: string;
    metadataOnly: boolean;
    api: Api;
    upsertEvent: (event: T) => void;
}
export const getPaginatedEvents = async <T>({
    calendarID,
    dateRange,
    tzid,
    metadataOnly,
    api,
    upsertEvent,
}: GetPaginatedEventParams<T>) => {
    const params = {
        // Special case, not using our boundaries, since the API does not accept negative values.
        Start: Math.max(0, getUnixTime(dateRange[0])),
        End: Math.max(0, getUnixTime(dateRange[1])),
        Timezone: tzid,
        PageSize,
    };
    const eventsOfType: T[][] = QUERY_TYPES.map(() => []);

    async function* getEventsOfType({ Type }: { Type: CalendarEventsQueryType }) {
        let More = 1;
        let Page = 0;
        let Events: T[] = [];
        while (More === 1) {
            ({ Events, More } = await api<ApiResponse<T>>(
                queryEvents(calendarID, { ...params, Type, Page, MetaDataOnly: booleanToNumber(metadataOnly) })
            ));
            Page += 1;
            yield Events;
        }
    }

    await Promise.all(
        QUERY_TYPES.map(async (Type) => {
            for await (const page of getEventsOfType({ Type })) {
                eventsOfType[Type].push(...page);
                for (const event of page) {
                    upsertEvent(event);
                }
            }
        })
    );

    return eventsOfType.flat();
};

export const getPaginatedCalendarEventsWithoutBlob = (
    params: Omit<GetPaginatedEventParams<CalendarEventWithoutBlob>, 'metadataOnly'>
) => {
    return getPaginatedEvents<CalendarEventWithoutBlob>({ ...params, metadataOnly: true });
};

export const getPaginatedCalendarEvents = (params: Omit<GetPaginatedEventParams<CalendarEvent>, 'metadataOnly'>) => {
    return getPaginatedEvents<CalendarEvent>({ ...params, metadataOnly: false });
};
