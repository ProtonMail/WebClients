import { toExdate } from '@proton/shared/lib/calendar/exdate';
import { convertTimestampToTimezone } from '@proton/shared/lib/date/timezone';

const getRecurrenceIdValueFromTimestamp = (unixTimestamp: number, isAllDay: boolean, startTimezone: string) => {
    const localStartDateTime = convertTimestampToTimezone(unixTimestamp, startTimezone);
    return toExdate(localStartDateTime, isAllDay, startTimezone);
};

export default getRecurrenceIdValueFromTimestamp;
