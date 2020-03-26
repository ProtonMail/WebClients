import { isNextDay, isSameDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';
import { c } from 'ttag';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';

interface Arguments {
    formattedHour: string;
    isAllDay: boolean;
    title: string;
    startDateTimezoned: Date;
    nowDateTimezoned: Date;
    formatOptions: any;
}
const getAlarmMessageText = ({ title, isAllDay, startDateTimezoned, nowDateTimezoned, formatOptions }: Arguments) => {
    const formattedHour = formatUTC(startDateTimezoned, 'p', formatOptions);

    const isInFuture = startDateTimezoned >= nowDateTimezoned;

    if (isSameDay(nowDateTimezoned, startDateTimezoned)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} started today`;
        }
        if (isInFuture) {
            return c('Alarm notification').t`${title} will start at ${formattedHour}`;
        }
        return c('Alarm notification').t`${title} started at ${formattedHour}`;
    }

    if (isNextDay(nowDateTimezoned, startDateTimezoned)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start tomorrow`;
        }
        return c('Alarm notification').t`${title} will start tomorrow at ${formattedHour}`;
    }

    if (isSameMonth(nowDateTimezoned, startDateTimezoned)) {
        const formattedDate = formatUTC(startDateTimezoned, 'eeee do', formatOptions);
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start on ${formattedDate}`;
        }
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }

    if (isSameYear(nowDateTimezoned, startDateTimezoned)) {
        const formattedDate = formatUTC(startDateTimezoned, 'eeee do MMMM', formatOptions);
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start on ${formattedDate}`;
        }
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }

    if (isAllDay) {
        const formattedDateWithoutTime = formatUTC(startDateTimezoned, 'PPPP', formatOptions);
        return c('Alarm notification').t`${title} will start on ${formattedDateWithoutTime}`;
    }

    const formattedDateWithTime = formatUTC(startDateTimezoned, 'PPPPp', formatOptions);
    if (isInFuture) {
        return c('Alarm notification').t`${title} will start on ${formattedDateWithTime}`;
    }

    return c('Alarm notification').t`${title} started on ${formattedDateWithTime}`;
};

export default getAlarmMessageText;
