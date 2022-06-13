import { getUnixTime } from 'date-fns';
import { CalendarEventsQueryType } from '@proton/shared/lib/interfaces/calendar/Api';
import { queryEvents } from '@proton/shared/lib/api/calendars';
import { Api } from '@proton/shared/lib/interfaces';
import { CalendarEventWithMetadata } from '@proton/shared/lib/interfaces/calendar';

interface ApiResponse {
    More: 0 | 1;
    Events: CalendarEventWithMetadata[];
}

const PageSize = 100;
const QUERY_TYPES = [
    CalendarEventsQueryType.PartDayInsideWindow,
    CalendarEventsQueryType.PartDayBeforeWindow,
    CalendarEventsQueryType.FullDayInsideWindow,
    CalendarEventsQueryType.FullDayBeforeWindow,
];

const getPaginatedEvents = async (
    api: Api,
    calendarID: string,
    dateRange: Date[],
    Timezone: string,
    upsertEvent: (event: CalendarEventWithMetadata) => void
) => {
    const params = {
        // Special case, not using our boundaries, since the API does not accept negative values.
        Start: Math.max(0, getUnixTime(dateRange[0])),
        End: Math.max(0, getUnixTime(dateRange[1])),
        Timezone,
        PageSize,
    };
    const eventsOfType: CalendarEventWithMetadata[][] = QUERY_TYPES.map(() => []);

    async function* getEventsOfType({ Type }: { Type: CalendarEventsQueryType }) {
        let More = 1;
        let Page = 0;
        let Events: CalendarEventWithMetadata[] = [];
        while (More === 1) {
            ({ Events, More } = await api<ApiResponse>(queryEvents(calendarID, { ...params, Type, Page })));
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

export default getPaginatedEvents;
