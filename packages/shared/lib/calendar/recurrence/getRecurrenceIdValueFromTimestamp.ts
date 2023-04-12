import { convertTimestampToTimezone } from '../../date/timezone';
import { toExdate } from '../exdate';

const getRecurrenceIdValueFromTimestamp = (unixTimestamp: number, isAllDay: boolean, startTimezone: string) => {
    const localStartDateTime = convertTimestampToTimezone(unixTimestamp, startTimezone);
    return toExdate(localStartDateTime, isAllDay, startTimezone);
};

export default getRecurrenceIdValueFromTimestamp;
