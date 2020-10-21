import { c, msgid } from 'ttag';
import { format } from '../../date-fns-utc';
import { WeekStartsOn } from '../../date-fns-utc/interface';
import { unique } from '../../helpers/array';
import { mod } from '../../helpers/math';
import { END_TYPE, FREQUENCY, MONTHLY_TYPE } from '../constants';
import { getPositiveSetpos } from '../helper';
import {
    VcalDateOrDateTimeProperty,
    VcalRrulePropertyValue,
    VcalRruleProperty,
} from '../../interfaces/calendar/VcalModel';
import { getEndType, getMonthType, getUntilDate, getWeeklyDays } from './rruleProperties';
import { getIsRruleCustom, getIsRruleSupported } from './rrule';
import { getPropertyTzid } from '../vcalHelper';
import { toUTCDate } from '../../date/timezone';

interface RruleEnd {
    type: END_TYPE;
    count?: number;
    until?: Date;
}
interface GetTimezonedFrequencyStringOptions {
    currentTzid: string;
    locale: Locale;
    weekStartsOn: WeekStartsOn;
}
// NOTE: due to the different grammar of different languages, to allow for a proper translation,
// we need to expand all possible cases so there will be quite a bit of duplicated code

export const getOnDayString = (date: Date, monthlyType: MONTHLY_TYPE) => {
    const dayOfMonth = date.getUTCDate();
    const day = date.getUTCDay();

    if (monthlyType === MONTHLY_TYPE.ON_NTH_DAY) {
        const setPos = getPositiveSetpos(date);
        if (setPos === 1) {
            if (day === 0) {
                return c('Monthly recurring event, repeats on').t`on the first Sunday`;
            }
            if (day === 1) {
                return c('Monthly recurring event, repeats on').t`on the first Monday`;
            }
            if (day === 2) {
                return c('Monthly recurring event, repeats on').t`on the first Tuesday`;
            }
            if (day === 3) {
                return c('Monthly recurring event, repeats on').t`on the first Wednesday`;
            }
            if (day === 4) {
                return c('Monthly recurring event, repeats on').t`on the first Thursday`;
            }
            if (day === 5) {
                return c('Monthly recurring event, repeats on').t`on the first Friday`;
            }
            if (day === 6) {
                return c('Monthly recurring event, repeats on').t`on the first Saturday`;
            }
        }
        if (setPos === 2) {
            if (day === 0) {
                return c('Monthly recurring event, repeats on').t`on the second Sunday`;
            }
            if (day === 1) {
                return c('Monthly recurring event, repeats on').t`on the second Monday`;
            }
            if (day === 2) {
                return c('Monthly recurring event, repeats on').t`on the second Tuesday`;
            }
            if (day === 3) {
                return c('Monthly recurring event, repeats on').t`on the second Wednesday`;
            }
            if (day === 4) {
                return c('Monthly recurring event, repeats on').t`on the second Thursday`;
            }
            if (day === 5) {
                return c('Monthly recurring event, repeats on').t`on the second Friday`;
            }
            if (day === 6) {
                return c('Monthly recurring event, repeats on').t`on the second Saturday`;
            }
        }
        if (setPos === 3) {
            if (day === 0) {
                return c('Monthly recurring event, repeats on').t`on the third Sunday`;
            }
            if (day === 1) {
                return c('Monthly recurring event, repeats on').t`on the third Monday`;
            }
            if (day === 2) {
                return c('Monthly recurring event, repeats on').t`on the third Tuesday`;
            }
            if (day === 3) {
                return c('Monthly recurring event, repeats on').t`on the third Wednesday`;
            }
            if (day === 4) {
                return c('Monthly recurring event, repeats on').t`on the third Thursday`;
            }
            if (day === 5) {
                return c('Monthly recurring event, repeats on').t`on the third Friday`;
            }
            if (day === 6) {
                return c('Monthly recurring event, repeats on').t`on the third Saturday`;
            }
        }
        if (setPos === 4) {
            if (day === 0) {
                return c('Monthly recurring event, repeats on').t`on the fourth Sunday`;
            }
            if (day === 1) {
                return c('Monthly recurring event, repeats on').t`on the fourth Monday`;
            }
            if (day === 2) {
                return c('Monthly recurring event, repeats on').t`on the fourth Tuesday`;
            }
            if (day === 3) {
                return c('Monthly recurring event, repeats on').t`on the fourth Wednesday`;
            }
            if (day === 4) {
                return c('Monthly recurring event, repeats on').t`on the fourth Thursday`;
            }
            if (day === 5) {
                return c('Monthly recurring event, repeats on').t`on the fourth Friday`;
            }
            if (day === 6) {
                return c('Monthly recurring event, repeats on').t`on the fourth Saturday`;
            }
        }
    }
    if (monthlyType === MONTHLY_TYPE.ON_MINUS_NTH_DAY) {
        if (day === 0) {
            return c('Monthly recurring event, repeats on').t`on the last Sunday`;
        }
        if (day === 1) {
            return c('Monthly recurring event, repeats on').t`on the last Monday`;
        }
        if (day === 2) {
            return c('Monthly recurring event, repeats on').t`on the last Tuesday`;
        }
        if (day === 3) {
            return c('Monthly recurring event, repeats on').t`on the last Wednesday`;
        }
        if (day === 4) {
            return c('Monthly recurring event, repeats on').t`on the last Thursday`;
        }
        if (day === 5) {
            return c('Monthly recurring event, repeats on').t`on the last Friday`;
        }
        if (day === 6) {
            return c('Monthly recurring event, repeats on').t`on the last Saturday`;
        }
    }
    return c('Monthly recurring event, repeats on').t`on day ${dayOfMonth}`;
};

const getTimesString = (count: number) => {
    return c('Daily recurring event, frequency').ngettext(msgid`${count} time`, `${count} times`, count);
};

const getUntilString = (dateString: string) => {
    return c('Daily recurring event, frequency').t`until ${dateString}`;
};

const getCustomDailyString = (
    rruleValue: VcalRrulePropertyValue,
    { type: endType, count = 1, until }: RruleEnd,
    locale: Locale
) => {
    const { interval = 1 } = rruleValue;

    if (endType === END_TYPE.NEVER) {
        if (interval === 1) {
            return c('Daily recurring event, frequency').t`Daily`;
        }
        return c('Daily recurring event, frequency').t`Every ${interval} days`;
    }

    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (interval === 1) {
            return c('Daily recurring event, frequency').t`Daily, ${timesString}`;
        }
        return c('Daily recurring event, frequency').t`Every ${interval} days, ${timesString}`;
    }

    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (interval === 1) {
            return c('Daily recurring event, frequency').t`Daily, ${untilString}`;
        }
        return c('Daily recurring event, frequency').t`Every ${interval} days, ${untilString}`;
    }
};
const getWeekdayString = (weekday: number) => {
    if (weekday === 0) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Sunday`;
    }
    if (weekday === 1) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Monday`;
    }
    if (weekday === 2) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Tuesday`;
    }
    if (weekday === 3) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Wednesday`;
    }
    if (weekday === 4) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Thursday`;
    }
    if (weekday === 5) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Friday`;
    }
    if (weekday === 6) {
        return c('Weekly recurring event, repeats on (multiple days), frequency').t`Saturday`;
    }
    throw new Error('Unknown weekday');
};

const getCustomWeeklyString = (
    { interval = 1, byday }: VcalRrulePropertyValue,
    { type: endType, count = 1, until }: RruleEnd,
    weekStartsOn: WeekStartsOn,
    startDate: Date,
    locale: Locale
) => {
    const days = getWeeklyDays(byday);
    const safeDays = unique([...days, startDate.getUTCDay()]);
    // sort weekly days depending on the day the week starts
    const sortedWeekDays = safeDays.slice().sort((a: number, b: number) => {
        // shift days. Get a positive modulus
        const A = mod(a - weekStartsOn, +7);
        const B = mod(b - weekStartsOn, 7);
        return A - B;
    });
    const multipleDaysString = sortedWeekDays.map(getWeekdayString).join(', ');

    if (endType === END_TYPE.NEVER) {
        if (days.length === 7) {
            if (interval === 1) {
                return c('Weekly recurring event, frequency').t`Weekly on all days`;
            }
            return c('Weekly recurring event, frequency').t`Every ${interval} weeks on all days`;
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Sunday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Sunday`;
            }
            if (startDate === 1) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Monday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Monday`;
            }
            if (startDate === 2) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Tuesday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Tuesday`;
            }
            if (startDate === 3) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Wednesday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Wednesday`;
            }
            if (startDate === 4) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Thursday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Thursday`;
            }
            if (startDate === 5) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Friday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Friday`;
            }
            if (startDate === 6) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Saturday`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Saturday`;
            }
        }
        if (interval === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on ${multipleDaysString}`;
        }
        return c('Weekly recurring event, frequency').t`Every ${interval} weeks on ${multipleDaysString}`;
    }
    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (days.length === 7) {
            if (interval === 1) {
                return c('Weekly recurring event, frequency').t`Weekly on all days, ${timesString}`;
            }
            return c('Weekly recurring event, frequency').t`Every ${interval} weeks on all days, ${timesString}`;
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Sunday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Sunday, ${timesString}`;
            }
            if (startDate === 1) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Monday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Monday, ${timesString}`;
            }
            if (startDate === 2) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Tuesday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Tuesday, ${timesString}`;
            }
            if (startDate === 3) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Wednesday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Wednesday, ${timesString}`;
            }
            if (startDate === 4) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Thursday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Thursday, ${timesString}`;
            }
            if (startDate === 5) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Friday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Friday, ${timesString}`;
            }
            if (startDate === 6) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Saturday, ${timesString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Saturday, ${timesString}`;
            }
        }
        if (interval === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on ${multipleDaysString}, ${timesString}`;
        }
        return c('Weekly recurring event, frequency')
            .t`Every ${interval} weeks on ${multipleDaysString}, ${timesString}`;
    }
    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (days.length === 7) {
            if (interval === 1) {
                return c('Weekly recurring event, frequency').t`Weekly on all days, ${untilString}`;
            }
            return c('Weekly recurring event, frequency').t`Every ${interval} weeks on all days, ${untilString}`;
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Sunday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Sunday, ${untilString}`;
            }
            if (startDate === 1) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Monday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Monday, ${untilString}`;
            }
            if (startDate === 2) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Tuesday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Tuesday, ${untilString}`;
            }
            if (startDate === 3) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Wednesday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Wednesday, ${untilString}`;
            }
            if (startDate === 4) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Thursday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Thursday, ${untilString}`;
            }
            if (startDate === 5) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Friday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Friday, ${untilString}`;
            }
            if (startDate === 6) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Saturday, ${untilString}`;
                }
                return c('Weekly recurring event, frequency').t`Every ${interval} weeks on Saturday, ${untilString}`;
            }
        }
        if (interval === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on ${multipleDaysString}, ${untilString}`;
        }
        return c('Weekly recurring event, frequency')
            .t`Every ${interval} weeks on ${multipleDaysString}, ${untilString}`;
    }
};

const getCustomMonthlyString = (
    rruleValue: VcalRrulePropertyValue,
    { type: endType, count = 1, until }: RruleEnd,
    monthlyType: MONTHLY_TYPE,
    date: Date,
    locale: Locale
) => {
    const { interval = 1 } = rruleValue;
    const onDayString = date ? getOnDayString(date, monthlyType) : '';
    if (endType === END_TYPE.NEVER) {
        if (interval === 1) {
            return c('Monthly recurring event, frequency').t`Monthly ${onDayString}`;
        }
        return c('Monthly recurring event, frequency').t`Every ${interval} months ${onDayString}`;
    }
    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (interval === 1) {
            return c('Monthly recurring event, frequency').t`Monthly ${onDayString}, ${timesString}`;
        }
        return c('Monthly recurring event, frequency').t`Every ${interval} months ${onDayString}, ${timesString}`;
    }
    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (interval === 1) {
            return c('Monthly recurring event, frequency').t`Monthly ${onDayString}, ${untilString}`;
        }
        return c('Monthly recurring event, frequency').t`Every ${interval} months ${onDayString}, ${untilString}`;
    }
};

const getCustomYearlyString = (
    { interval = 1 }: VcalRrulePropertyValue,
    { type: endType, count = 1, until }: RruleEnd,
    locale: Locale
) => {
    if (endType === END_TYPE.NEVER) {
        if (interval === 1) {
            return c('Yearly recurring event, frequency').t`Yearly`;
        }
        return c('Yearly recurring event, frequency').t`Every ${interval} years`;
    }

    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (interval === 1) {
            return c('Yearly recurring event, frequency').t`Yearly, ${timesString}`;
        }
        return c('Yearly recurring event, frequency').t`Every ${interval} years, ${timesString}`;
    }

    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (interval === 1) {
            return c('Yearly recurring event, frequency').t`Yearly, ${untilString}`;
        }
        return c('Yearly recurring event, frequency').t`Every ${interval} years, ${untilString}`;
    }
};

export const getFrequencyString = (
    rruleValue: VcalRrulePropertyValue,
    dtstart: VcalDateOrDateTimeProperty,
    { weekStartsOn, locale }: Pick<GetTimezonedFrequencyStringOptions, 'weekStartsOn' | 'locale'>,
    isInvitation = false
) => {
    const { freq, count, until } = rruleValue;

    const isCustom = getIsRruleCustom(rruleValue);
    const isSupported = getIsRruleSupported(rruleValue, isInvitation);
    const startFakeUtcDate = toUTCDate(dtstart.value);
    const startDay = startFakeUtcDate.getUTCDay();
    const end = {
        type: getEndType(count, until),
        count,
        until: getUntilDate(until, getPropertyTzid(dtstart)),
    };

    if (!isSupported) {
        if (!freq) {
            return c('Info').t`Custom`;
        }
        const frequencyString = freq.toLowerCase();
        return c('Info').t`Custom ${frequencyString}`;
    }
    if (isCustom) {
        if (freq === FREQUENCY.DAILY) {
            return getCustomDailyString(rruleValue, end, locale);
        }
        if (freq === FREQUENCY.WEEKLY) {
            return getCustomWeeklyString(rruleValue, end, weekStartsOn, startFakeUtcDate, locale);
        }
        if (freq === FREQUENCY.MONTHLY) {
            const { byday, bysetpos } = rruleValue;
            const monthType = getMonthType(byday, bysetpos);
            return getCustomMonthlyString(rruleValue, end, monthType, startFakeUtcDate, locale);
        }
        if (freq === FREQUENCY.YEARLY) {
            return getCustomYearlyString(rruleValue, end, locale);
        }
    }
    if (freq === FREQUENCY.DAILY) {
        return c('Info').t`Daily`;
    }
    if (freq === FREQUENCY.WEEKLY) {
        if (startDay === 0) {
            return c('Weekly recurring event, frequency').t`Weekly on Sunday`;
        }
        if (startDay === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on Monday`;
        }
        if (startDay === 2) {
            return c('Weekly recurring event, frequency').t`Weekly on Tuesday`;
        }
        if (startDay === 3) {
            return c('Weekly recurring event, frequency').t`Weekly on Wednesday`;
        }
        if (startDay === 4) {
            return c('Weekly recurring event, frequency').t`Weekly on Thursday`;
        }
        if (startDay === 5) {
            return c('Weekly recurring event, frequency').t`Weekly on Friday`;
        }
        if (startDay === 6) {
            return c('Weekly recurring event, frequency').t`Weekly on Saturday`;
        }
    }
    if (freq === FREQUENCY.MONTHLY) {
        const { byday, bysetpos } = rruleValue;
        const monthType = getMonthType(byday, bysetpos);
        const onDayString = getOnDayString(startFakeUtcDate, monthType);
        return c('Info').t`Monthly ${onDayString}`;
    }
    if (freq === FREQUENCY.YEARLY) {
        return c('Info').t`Yearly`;
    }
    return '';
};

export const getTimezonedFrequencyString = (
    rrule: VcalRruleProperty | undefined,
    dtstart: VcalDateOrDateTimeProperty,
    options: GetTimezonedFrequencyStringOptions,
    isInvitation = false
) => {
    if (!rrule) {
        return '';
    }
    const { value: rruleValue } = rrule;
    const startTzid = getPropertyTzid(dtstart);
    const { currentTzid } = options;

    if (!startTzid || startTzid === currentTzid) {
        return getFrequencyString(rruleValue, dtstart, options, isInvitation);
    }

    const isTimezoneStringNeeded = (() => {
        const { freq, count, until, byday } = rruleValue;

        const isCustom = getIsRruleCustom(rruleValue);
        const endType = getEndType(count, until);

        if (!freq) {
            return false;
        }
        if ([FREQUENCY.DAILY, FREQUENCY.YEARLY].includes(freq as FREQUENCY)) {
            return isCustom && endType === END_TYPE.UNTIL;
        }
        if (freq === FREQUENCY.WEEKLY) {
            const days = getWeeklyDays(byday);
            const hasCustomUntil = isCustom && endType === END_TYPE.UNTIL;
            const hasDays = days.length !== 7;
            return hasCustomUntil || hasDays;
        }
        // if (frequency === FREQUENCY.YEARLY) {
        //     return true;
        // }
        if (freq === FREQUENCY.MONTHLY) {
            return true;
        }
        return false;
    })();

    const timezoneString = isTimezoneStringNeeded ? ` (${startTzid})` : '';
    return getFrequencyString(rruleValue, dtstart, options, isInvitation) + timezoneString;
};
