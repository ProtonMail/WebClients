import { END_TYPE, FREQUENCY } from '../constants';
import { c, msgid } from 'ttag';
import { format } from 'date-fns';

const getFrequencyString = (
    { type, frequency, interval, weekly, ends: { type: endType, until, count } },
    { weekdays, locale }
) => {
    const startDay = weekdays[weekly.days[0]];

    if (type === FREQUENCY.DAILY) {
        return c('Info').t`Daily`;
    }
    if (type === FREQUENCY.WEEKLY) {
        return c('Info').t`Weekly on ${startDay}`;
    }
    if (type === FREQUENCY.MONTHLY) {
        return c('Info').t`Monthly`;
    }
    if (type === FREQUENCY.YEARLY) {
        return c('Info').t`Yearly`;
    }
    if (type === FREQUENCY.CUSTOM) {
        if (frequency === FREQUENCY.DAILY) {
            const frequencyString = c('Info').ngettext(msgid`Daily`, `Every ${interval} days`, interval);
            const durationString = (() => {
                if (endType === END_TYPE.AFTER_N_TIMES) {
                    return c('Info').ngettext(msgid`, ${count} time`, `, ${count} times`, count);
                }
                if (endType === END_TYPE.UNTIL) {
                    const untilString = format(until, 'd MMM yyyy', { locale });
                    return c('Info').t` until ${untilString}`;
                }
                return '';
            })();
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
                return weekly.days.map((dayIndex) => weekdays[dayIndex]).join(', ');
            })();
            const frequencyString = c('Info').ngettext(
                msgid`Weekly on ${days}`,
                `Every ${interval} weeks on ${days}`,
                interval
            );
            const durationString = (() => {
                if (endType === END_TYPE.AFTER_N_TIMES) {
                    return c('Info').ngettext(msgid`; ${count} time`, `; ${count} times`, count);
                }
                if (endType === END_TYPE.UNTIL) {
                    const untilString = format(until, 'd MMM yyyy', { locale });
                    return c('Info').t`; until ${untilString}`;
                }
                return '';
            })();
            return frequencyString + durationString;
        }
        if (frequency === FREQUENCY.YEARLY) {
            const frequencyString = c('Info').ngettext(msgid`Yearly`, `Every ${interval} years`, interval);
            const durationString = (() => {
                if (endType === END_TYPE.AFTER_N_TIMES) {
                    return c('Info').ngettext(msgid`, ${count} time`, `, ${count} times`, count);
                }
                if (endType === END_TYPE.UNTIL) {
                    const untilString = format(until, 'd MMM yyyy', { locale });
                    return c('Info').t` until ${untilString}`;
                }
                return '';
            })();
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
        if (frequency === FREQUENCY.DAILY) {
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
        return false;
    })();
    const timezoneString = isTimezoneStringNeeded ? ` (${startTzid})` : '';

    return getFrequencyString(frequencyModel, options) + timezoneString;
};
