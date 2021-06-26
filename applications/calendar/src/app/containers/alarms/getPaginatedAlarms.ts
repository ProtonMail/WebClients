import { CalendarAlarm } from 'proton-shared/lib/interfaces/calendar';
import { getUnixTime } from 'date-fns';
import { queryCalendarAlarms } from 'proton-shared/lib/api/calendars';
import { Api } from 'proton-shared/lib/interfaces';

const MAX_FETCH_ITERATIONS = 100;

const getPaginatedAlarms = async (api: Api, calendarID: string, dateRange: Date[]) => {
    let results: CalendarAlarm[] = [];

    const PageSize = 100;

    const params = {
        End: getUnixTime(dateRange[1]),
        PageSize,
    };

    let lastStart: number | undefined = getUnixTime(dateRange[0]);
    let iterations = 0;

    while (lastStart !== undefined && iterations < MAX_FETCH_ITERATIONS) {
        // https://github.com/microsoft/TypeScript/issues/36687
        // @ts-ignore
        const { Alarms = [] } = await api<{ Alarms: CalendarAlarm[] }>(
            queryCalendarAlarms(calendarID, { ...params, Start: lastStart })
        );
        const lastAlarm = Alarms.length > 0 ? Alarms[Alarms.length - 1] : undefined;
        results = results.concat(Alarms);
        lastStart = Alarms.length === PageSize && lastAlarm ? lastAlarm.Occurrence : undefined;
        iterations++;
    }

    return results;
};

export default getPaginatedAlarms;
