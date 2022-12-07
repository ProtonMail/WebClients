import { SECOND } from '@proton/shared/lib/constants';
import { fromUTCDate, toLocalDate } from '@proton/shared/lib/date/timezone';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

export const getEventLocalStartEndDates = (event: CalendarEvent, occurrenceTimestamp: number) => {
    const { StartTime, EndTime, FullDay } = event;
    const isAllDay = !!FullDay;
    const duration = (EndTime - StartTime) * SECOND;
    const startUtcDate = new Date(occurrenceTimestamp * SECOND);
    const startDate = isAllDay ? toLocalDate(fromUTCDate(startUtcDate)) : startUtcDate;
    return [startDate, new Date(+startDate + duration)];
};
