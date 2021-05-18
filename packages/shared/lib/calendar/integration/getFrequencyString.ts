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
import { getIsRruleCustom, getIsRruleSimple } from '../rrule';
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
        // translator: When interval = 1 we do not use this string; we use 'daily' instead. Treat the case of interval = 1 as dummy
        return c('Daily recurring event, frequency').ngettext(
            msgid`Every ${interval} day`,
            `Every ${interval} days`,
            interval
        );
    }

    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (interval === 1) {
            return c('Daily recurring event, frequency').t`Daily, ${timesString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'daily' instead. Treat the case of interval = 1 as dummy
        return c('Daily recurring event, frequency').ngettext(
            msgid`Every ${interval} day, ${timesString}`,
            `Every ${interval} days, ${timesString}`,
            interval
        );
    }

    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (interval === 1) {
            return c('Daily recurring event, frequency').t`Daily, ${untilString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'daily' instead. Treat the case of interval = 1 as dummy
        return c('Daily recurring event, frequency').ngettext(
            msgid`Every ${interval} day, ${untilString}`,
            `Every ${interval} days, ${untilString}`,
            interval
        );
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
            // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
            return c('Weekly recurring event, frequency').ngettext(
                msgid`Every ${interval} week on all days`,
                `Every ${interval} weeks on all days`,
                interval
            );
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Sunday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Sunday`,
                    `Every ${interval} weeks on Sunday`,
                    interval
                );
            }
            if (startDate === 1) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Monday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Monday`,
                    `Every ${interval} weeks on Monday`,
                    interval
                );
            }
            if (startDate === 2) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Tuesday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Tuesday`,
                    `Every ${interval} weeks on Tuesday`,
                    interval
                );
            }
            if (startDate === 3) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Wednesday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Wednesday`,
                    `Every ${interval} weeks on Wednesday`,
                    interval
                );
            }
            if (startDate === 4) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Thursday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Thursday`,
                    `Every ${interval} weeks on Thursday`,
                    interval
                );
            }
            if (startDate === 5) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Friday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Friday`,
                    `Every ${interval} weeks on Friday`,
                    interval
                );
            }
            if (startDate === 6) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Saturday`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Saturday`,
                    `Every ${interval} weeks on Saturday`,
                    interval
                );
            }
        }
        if (interval === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on ${multipleDaysString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
        return c('Weekly recurring event, frequency').ngettext(
            msgid`Every ${interval} week on ${multipleDaysString}`,
            `Every ${interval} weeks on ${multipleDaysString}`,
            interval
        );
    }
    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (days.length === 7) {
            if (interval === 1) {
                return c('Weekly recurring event, frequency').t`Weekly on all days, ${timesString}`;
            }
            // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
            return c('Weekly recurring event, frequency').ngettext(
                msgid`Every ${interval} week on all days, ${timesString}`,
                `Every ${interval} weeks on all days, ${timesString}`,
                interval
            );
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Sunday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Sunday, ${timesString}`,
                    `Every ${interval} weeks on Sunday, ${timesString}`,
                    interval
                );
            }
            if (startDate === 1) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Monday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Monday, ${timesString}`,
                    `Every ${interval} weeks on Monday, ${timesString}`,
                    interval
                );
            }
            if (startDate === 2) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Tuesday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Tuesday, ${timesString}`,
                    `Every ${interval} weeks on Tuesday, ${timesString}`,
                    interval
                );
            }
            if (startDate === 3) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Wednesday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Wednesday, ${timesString}`,
                    `Every ${interval} weeks on Wednesday, ${timesString}`,
                    interval
                );
            }
            if (startDate === 4) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Thursday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Thursday, ${timesString}`,
                    `Every ${interval} weeks on Thursday, ${timesString}`,
                    interval
                );
            }
            if (startDate === 5) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Friday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Friday, ${timesString}`,
                    `Every ${interval} weeks on Friday, ${timesString}`,
                    interval
                );
            }
            if (startDate === 6) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Saturday, ${timesString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Saturday, ${timesString}`,
                    `Every ${interval} weeks on Saturday, ${timesString}`,
                    interval
                );
            }
        }
        if (interval === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on ${multipleDaysString}, ${timesString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
        return c('Weekly recurring event, frequency').ngettext(
            msgid`Every ${interval} week on ${multipleDaysString}, ${timesString}`,
            `Every ${interval} weeks on ${multipleDaysString}, ${timesString}`,
            interval
        );
    }
    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (days.length === 7) {
            if (interval === 1) {
                return c('Weekly recurring event, frequency').t`Weekly on all days, ${untilString}`;
            }
            // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
            return c('Weekly recurring event, frequency').ngettext(
                msgid`Every ${interval} week on all days, ${untilString}`,
                `Every ${interval} weeks on all days, ${untilString}`,
                interval
            );
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Sunday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Sunday, ${untilString}`,
                    `Every ${interval} weeks on Sunday, ${untilString}`,
                    interval
                );
            }
            if (startDate === 1) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Monday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Monday, ${untilString}`,
                    `Every ${interval} weeks on Monday, ${untilString}`,
                    interval
                );
            }
            if (startDate === 2) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Tuesday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Tuesday, ${untilString}`,
                    `Every ${interval} weeks on Tuesday, ${untilString}`,
                    interval
                );
            }
            if (startDate === 3) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Wednesday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Wednesday, ${untilString}`,
                    `Every ${interval} weeks on Wednesday, ${untilString}`,
                    interval
                );
            }
            if (startDate === 4) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Thursday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Thursday, ${untilString}`,
                    `Every ${interval} weeks on Thursday, ${untilString}`,
                    interval
                );
            }
            if (startDate === 5) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Friday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Friday, ${untilString}`,
                    `Every ${interval} weeks on Friday, ${untilString}`,
                    interval
                );
            }
            if (startDate === 6) {
                if (interval === 1) {
                    return c('Weekly recurring event, frequency').t`Weekly on Saturday, ${untilString}`;
                }
                // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Every ${interval} week on Saturday, ${untilString}`,
                    `Every ${interval} weeks on Saturday, ${untilString}`,
                    interval
                );
            }
        }
        if (interval === 1) {
            return c('Weekly recurring event, frequency').t`Weekly on ${multipleDaysString}, ${untilString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'weekly' instead. Treat the case of interval = 1 as dummy
        return c('Weekly recurring event, frequency').ngettext(
            msgid`Every ${interval} week on ${multipleDaysString}, ${untilString}`,
            `Every ${interval} weeks on ${multipleDaysString}, ${untilString}`,
            interval
        );
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
        // translator: When interval = 1 we do not use this string; we use 'monthly' instead. Treat the case of interval = 1 as dummy
        return c('Monthly recurring event, frequency').ngettext(
            msgid`Every ${interval} month ${onDayString}`,
            `Every ${interval} months ${onDayString}`,
            interval
        );
    }
    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (interval === 1) {
            return c('Monthly recurring event, frequency').t`Monthly ${onDayString}, ${timesString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'monthly' instead. Treat the case of interval = 1 as dummy
        return c('Monthly recurring event, frequency').ngettext(
            msgid`Every ${interval} month ${onDayString}, ${timesString}`,
            `Every ${interval} months ${onDayString}, ${timesString}`,
            interval
        );
    }
    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (interval === 1) {
            return c('Monthly recurring event, frequency').t`Monthly ${onDayString}, ${untilString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'monthly' instead. Treat the case of interval = 1 as dummy
        return c('Monthly recurring event, frequency').ngettext(
            msgid`Every ${interval} month ${onDayString}, ${untilString}`,
            `Every ${interval} months ${onDayString}, ${untilString}`,
            interval
        );
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
        // translator: When interval = 1 we do not use this string; we use 'yearly' instead. Treat the case of interval = 1 as dummy
        return c('Yearly recurring event, frequency').ngettext(
            msgid`Every ${interval} year`,
            `Every ${interval} years`,
            interval
        );
    }

    if (endType === END_TYPE.AFTER_N_TIMES) {
        const timesString = getTimesString(count);
        if (interval === 1) {
            return c('Yearly recurring event, frequency').t`Yearly, ${timesString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'yearly' instead. Treat the case of interval = 1 as dummy
        return c('Yearly recurring event, frequency').ngettext(
            msgid`Every ${interval} year, ${timesString}`,
            `Every ${interval} years, ${timesString}`,
            interval
        );
    }

    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        const untilString = getUntilString(dateString);
        if (interval === 1) {
            return c('Yearly recurring event, frequency').t`Yearly, ${untilString}`;
        }
        // translator: When interval = 1 we do not use this string; we use 'yearly' instead. Treat the case of interval = 1 as dummy
        return c('Yearly recurring event, frequency').ngettext(
            msgid`Every ${interval} year, ${untilString}`,
            `Every ${interval} years, ${untilString}`,
            interval
        );
    }
};

export const getFrequencyString = (
    rruleValue: VcalRrulePropertyValue,
    dtstart: VcalDateOrDateTimeProperty,
    { weekStartsOn, locale }: Pick<GetTimezonedFrequencyStringOptions, 'weekStartsOn' | 'locale'>
) => {
    const { freq, count, until } = rruleValue;

    const isSimple = getIsRruleSimple(rruleValue);
    const isCustom = getIsRruleCustom(rruleValue);
    const startFakeUtcDate = toUTCDate(dtstart.value);
    const startDay = startFakeUtcDate.getUTCDay();
    const end = {
        type: getEndType(count, until),
        count,
        until: getUntilDate(until, getPropertyTzid(dtstart)),
    };

    if (!isSimple) {
        if (!isCustom) {
            if (freq === FREQUENCY.DAILY) {
                return c('Info').t`Custom daily`;
            }
            if (freq === FREQUENCY.WEEKLY) {
                return c('Info').t`Custom weekly`;
            }
            if (freq === FREQUENCY.MONTHLY) {
                return c('Info').t`Custom monthly`;
            }
            if (freq === FREQUENCY.YEARLY) {
                return c('Info').t`Custom yearly`;
            }
            return c('Info').t`Custom`;
        }
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
    options: GetTimezonedFrequencyStringOptions
) => {
    if (!rrule) {
        return '';
    }
    const { value: rruleValue } = rrule;
    const startTzid = getPropertyTzid(dtstart);
    const { currentTzid } = options;

    if (!startTzid || startTzid === currentTzid) {
        return getFrequencyString(rruleValue, dtstart, options);
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
        if (freq === FREQUENCY.MONTHLY) {
            return true;
        }
        return false;
    })();

    const timezoneString = isTimezoneStringNeeded ? ` (${startTzid})` : '';
    return getFrequencyString(rruleValue, dtstart, options) + timezoneString;
};
