import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import { truncate } from 'proton-shared/lib/helpers/string';
import getAlarmMessageText from './getAlarmMessageText';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

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
        formatOptions
    });
};
