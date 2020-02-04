import { END_TYPE, FREQUENCY, MONTHLY_TYPE } from '../constants';
import { c, msgid } from 'ttag';
import { format, getDaysInMonth } from 'date-fns';

export const getPositiveSetpos = (date) => {
    const shiftedMonthDay = date.getDate() - 1;
    return Math.floor(shiftedMonthDay / 7) + 1;
};

export const getNegativeSetpos = (date) => {
    const monthDay = date.getDate();
    const daysInMonth = getDaysInMonth(date);

    // return -1 if it's the last occurrence in the month
    return Math.ceil((monthDay - daysInMonth) / 7) - 1;
};

const getMonthOrdinal = (nth) => {
    if (nth === 1) {
        return c('Ordinal number').t`first`;
    }
    if (nth === 2) {
        return c('Ordinal number').t`second`;
    }
    if (nth === 3) {
        return c('Ordinal number').t`third`;
    }
    if (nth === 4) {
        return c('Ordinal number').t`fourth`;
    }
    if (nth === 5) {
        return c('Ordinal number').t`fifth`;
    }
    if (nth === -1) {
        return c('Ordinal number').t`last`;
    }
    return '';
};

export const getOnDayString = (date, monthlyType, weekdays) => {
    const monthday = date.getDate();
    const weekday = weekdays[date.getDay()];
    const positiveOrdinal = getMonthOrdinal(getPositiveSetpos(date));
    const negativeOrdinal = getMonthOrdinal(getNegativeSetpos(date));

    if (monthlyType === MONTHLY_TYPE.ON_NTH_DAY) {
        return c('Info').t`on the ${positiveOrdinal} ${weekday}`;
    }
    if (monthlyType === MONTHLY_TYPE.ON_MINUS_NTH_DAY) {
        return c('Info').t`on the ${negativeOrdinal} ${weekday}`;
    }
    return c('Info').t`on day ${monthday}`;
};

const getDurationString = ({ endType, count, until, countSeparator = ',', untilSeparator = '' }, locale) => {
    if (endType === END_TYPE.AFTER_N_TIMES) {
        return c('Info').ngettext(msgid`${countSeparator} ${count} time`, `${countSeparator} ${count} times`, count);
    }
    if (endType === END_TYPE.UNTIL) {
        const untilString = format(until, 'd MMM yyyy', { locale });
        return c('Info').t`${untilSeparator} until ${untilString}`;
    }
    return '';
};

const getFrequencyString = (
    { type, frequency, interval, weekly, monthly, ends: { type: endType, until, count } },
    { date, weekStartsOn, weekdays, locale }
) => {
    const startDay = weekdays[weekly.days[0]];
    const onDayString = date ? getOnDayString(date, monthly.type, weekdays) : '';

    if (type === FREQUENCY.DAILY) {
        return c('Info').t`Daily`;
    }
    if (type === FREQUENCY.WEEKLY) {
        return c('Info').t`Weekly on ${startDay}`;
    }
    if (type === FREQUENCY.MONTHLY) {
        return c('Info').t`Monthly ${onDayString}`;
    }
    if (type === FREQUENCY.YEARLY) {
        return c('Info').t`Yearly`;
    }
    if (type === FREQUENCY.CUSTOM) {
        if (frequency === FREQUENCY.DAILY) {
            const frequencyString = c('Info').ngettext(msgid`Daily`, `Every ${interval} days`, interval);
            const durationString = getDurationString({ endType, count, until }, locale);

            return frequencyString + durationString;
        }
        if (frequency === FREQUENCY.WEEKLY) {
            const days = (() => {
                if (weekly.days.length === 7) {
                    return c('Info').t`all days`;
                }
                if (weekly.days.length === 1) {
                    return startDay;
                }
                // sort weekly days depending on the day the week starts
                const sortedWeeklyDays = weekly.days.sort((a, b) => {
                    // shift days. Get a positive modulus
                    const A = (a - weekStartsOn + 7) % 7;
                    const B = (b - weekStartsOn + 7) % 7;
                    return A - B;
                });

                return sortedWeeklyDays.map((dayIndex) => weekdays[dayIndex]).join(', ');
            })();
            const frequencyString = c('Info').ngettext(
                msgid`Weekly on ${days}`,
                `Every ${interval} weeks on ${days}`,
                interval
            );
            const durationString = getDurationString(
                { endType, count, until, locale, countSeparator: ';', untilSeparator: ';' },
                locale
            );

            return frequencyString + durationString;
        }
        if (frequency === FREQUENCY.MONTHLY) {
            const intervalString = c('Info').ngettext(msgid`Monthly`, `Every ${interval} months`, interval);
            const onDayString = getOnDayString(date, monthly.type, weekdays);
            const frequencyString = `${intervalString} ${onDayString}`;
            const durationString = getDurationString(
                { endType, count, until, locale, countSeparator: ',', untilSeparator: ',' },
                locale
            );

            return frequencyString + durationString;
        }
        if (frequency === FREQUENCY.YEARLY) {
            const frequencyString = c('Info').ngettext(msgid`Yearly`, `Every ${interval} years`, interval);
            const durationString = getDurationString({ endType, count, until, locale }, locale);

            return frequencyString + durationString;
        }
    }
    return '';
};

export const getTimezonedFrequencyString = (frequencyModel, options) => {
    const {
        type,
        frequency,
        weekly: { days },
        ends: { type: endType }
    } = frequencyModel;
    const { startTzid, currentTzid } = options;

    if (!startTzid || startTzid === currentTzid) {
        return getFrequencyString(frequencyModel, options);
    }

    const isTimezoneStringNeeded = (() => {
        if (type === FREQUENCY.ONCE) {
            return false;
        }
        if ([FREQUENCY.DAILY, FREQUENCY.YEARLY].includes(frequency)) {
            return type === FREQUENCY.CUSTOM && endType === END_TYPE.UNTIL;
        }
        if (frequency === FREQUENCY.WEEKLY) {
            const isStandardWeekly = type === FREQUENCY.WEEKLY;
            const hasCustomUntil = type === FREQUENCY.CUSTOM && endType === END_TYPE.UNTIL;
            const hasDays = isStandardWeekly || days.length !== 7;

            return isStandardWeekly || hasCustomUntil || hasDays;
        }
        // if (frequency === FREQUENCY.YEARLY) {
        //     return true;
        // }
        if (frequency === FREQUENCY.MONTHLY) {
            return true;
        }
        return false;
    })();
    const timezoneString = isTimezoneStringNeeded ? ` (${startTzid})` : '';

    return getFrequencyString(frequencyModel, options) + timezoneString;
};
