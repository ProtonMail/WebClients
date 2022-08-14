import { toExdate } from './exdate';
import utcTimestampToTimezone from './utcTimestampToTimezone';

const getRecurrenceIdValueFromTimestamp = (timestamp: number, isAllDay: boolean, startTimezone: string) => {
    const localStartDateTime = utcTimestampToTimezone(timestamp, startTimezone);
    return toExdate(localStartDateTime, isAllDay, startTimezone);
};

export default getRecurrenceIdValueFromTimestamp;
