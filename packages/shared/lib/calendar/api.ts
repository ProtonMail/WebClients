import { getEventByUID } from '../api/calendars';
import { Api } from '../interfaces';
import { CalendarEvent, GetEventByUIDArguments } from '../interfaces/calendar';
import { CALENDAR_TYPE } from './constants';

const MAX_ITERATIONS = 100;

export const getPaginatedEventsByUID = async ({
    api,
    uid,
    recurrenceID,
    max = MAX_ITERATIONS,
    calendarType,
}: {
    api: Api;
    uid: string;
    recurrenceID?: number;
    max?: number;
    calendarType?: CALENDAR_TYPE;
}) => {
    const pageSize = 100;
    let pageNumber = 0;
    let result: CalendarEvent[] = [];

    while (pageNumber < max) {
        const params: GetEventByUIDArguments = {
            UID: uid,
            RecurrenceID: recurrenceID,
            Page: pageNumber,
            PageSize: pageSize,
        };

        if (calendarType !== undefined) {
            params.CalendarType = calendarType;
        }
        const page = await api<{ Events: CalendarEvent[] }>(getEventByUID(params));
        result = result.concat(page.Events);
        if (page.Events.length !== pageSize) {
            break;
        }
        pageNumber++;
    }

    return result;
};

export const reformatApiErrorMessage = (message: string) => {
    if (message.toLowerCase().endsWith('. please try again')) {
        return message.slice(0, -18);
    }
    return message;
};
