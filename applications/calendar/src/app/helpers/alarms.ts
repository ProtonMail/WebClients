import { getMillisecondsFromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone, getTimezoneOffset } from 'proton-shared/lib/date/timezone';
import { truncate } from 'proton-shared/lib/helpers/string';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { MINUTE } from '../constants';
import getAlarmMessageText from './getAlarmMessageText';

/**
 * Given a raw event, (optionally) its starting date, the date now and a timezone id,
 * generate a notification message for the event
 */
interface Arguments {
    component: VcalVeventComponent;
    start?: Date;
    now: Date;
    tzid: string;
    formatOptions: any;
}
export const getAlarmMessage = ({ component, start, now, tzid, formatOptions }: Arguments) => {
    const { dtstart, summary } = component;
    const title = truncate(summary?.value, 100);
    const utcStartDate = start || propertyToUTCDate(dtstart);

    // To determine if the event is happening in timezoned today, tomorrow, this month or this year,
    // we pass fake UTC dates to the getAlarmMessage helper
    const startFakeUTCDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStartDate), tzid));
    const nowFakeUTCDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(now), tzid));
    const isAllDay = isIcalAllDay(component);

    return getAlarmMessageText({
        title,
        isAllDay,
        startFakeUTCDate,
        nowFakeUTCDate,
        formatOptions,
    });
};

/**
 * Given the UNIX timestamp for the occurrence of an alarm, and the trigger string of this alarm,
 * return the timestamp in milliseconds the occurrence of the corresponding event.
 * The computation must take into account possible DST shifts
 */
interface Params {
    Occurrence: number;
    Trigger: string;
    tzid: string;
}
export const getNextEventTime = ({ Occurrence, Trigger, tzid }: Params) => {
    const alarmTime = Occurrence * 1000;
    const eventTime = alarmTime - getMillisecondsFromTriggerString(Trigger);
    const offsetAlarmTime = getTimezoneOffset(new Date(alarmTime), tzid).offset;
    const offsetEventTime = getTimezoneOffset(new Date(eventTime), tzid).offset;
    const offsetDifference = offsetAlarmTime - offsetEventTime;
    // correct eventTime in case we jumped across an odd number of DST changes
    return eventTime - offsetDifference * MINUTE * 1000;
};
