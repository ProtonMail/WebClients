import { fromUnixTime } from 'date-fns';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getRecurrenceId } from 'proton-shared/lib/calendar/vcalHelper';
import { toExdate } from '../recurrence/helper';

export const getRecurrenceIdDate = (component: VcalVeventComponent) => {
    const rawRecurrenceId = getRecurrenceId(component);
    if (!rawRecurrenceId || !rawRecurrenceId.value) {
        return;
    }
    return toUTCDate(rawRecurrenceId.value);
};

export const getUidValue = (component: VcalVeventComponent) => {
    return component.uid.value;
};

export const utcTimestampToTimezone = (unixTime: number, timezone: string) => {
    return convertUTCDateTimeToZone(fromUTCDate(fromUnixTime(unixTime)), timezone);
};

export const getRecurrenceIdValueFromTimestamp = (timestamp: number, isAllDay: boolean, startTimezone: string) => {
    const localStartDateTime = utcTimestampToTimezone(timestamp, startTimezone);
    return toExdate(localStartDateTime, isAllDay, startTimezone);
};
