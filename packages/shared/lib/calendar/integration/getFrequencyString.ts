import { format } from 'date-fns';
import { c, msgid } from 'ttag';
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

const getCustomDailyString = (
    rruleValue: VcalRrulePropertyValue,
    { type: endType, count = 1, until }: RruleEnd,
    locale: Locale
) => {
    const { interval = 1 } = rruleValue;

    if (endType === END_TYPE.NEVER) {
        return c('Daily recurring event, frequency').ngettext(msgid`Daily`, `Every ${interval} days`, interval);
    }

    if (endType === END_TYPE.AFTER_N_TIMES) {
        return interval === 1
            ? c('Daily recurring event, frequency').ngettext(
                  msgid`Daily, ${count} time`,
                  `Daily, ${count} times`,
                  count
              )
            : c('Daily recurring event, frequency').ngettext(
                  msgid`Every ${interval} days, ${count} time`,
                  `Every ${interval} days, ${count} times`,
                  count
              );
    }

    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        return c('Daily recurring event, frequency').ngettext(
            msgid`Daily, until ${dateString}`,
            `Every ${interval} days, until ${dateString}`,
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
            return c('Weekly recurring event, frequency').ngettext(
                msgid`Weekly on all days`,
                `Every ${interval} weeks on all days`,
                interval
            );
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Sunday`,
                    `Every ${interval} weeks on Sunday`,
                    interval
                );
            }
            if (startDate === 1) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Monday`,
                    `Every ${interval} weeks on Monday`,
                    interval
                );
            }
            if (startDate === 2) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Tuesday`,
                    `Every ${interval} weeks on Tuesday`,
                    interval
                );
            }
            if (startDate === 3) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Wednesday`,
                    `Every ${interval} weeks on Wednesday`,
                    interval
                );
            }
            if (startDate === 4) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Thursday`,
                    `Every ${interval} weeks on Thursday`,
                    interval
                );
            }
            if (startDate === 5) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Friday`,
                    `Every ${interval} weeks on Friday`,
                    interval
                );
            }
            if (startDate === 6) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Saturday`,
                    `Every ${interval} weeks on Saturday`,
                    interval
                );
            }
        }
        return c('Weekly recurring event, frequency').ngettext(
            msgid`Weekly on ${multipleDaysString}`,
            `Every ${interval} weeks on ${multipleDaysString}`,
            interval
        );
    }
    if (endType === END_TYPE.AFTER_N_TIMES) {
        if (days.length === 7) {
            return interval === 1
                ? c('Weekly recurring event, frequency').ngettext(
                      msgid`Weekly on all days, ${count} time`,
                      `Weekly on all days, ${count} times`,
                      count
                  )
                : c('Weekly recurring event, frequency').ngettext(
                      msgid`Every ${interval} weeks on all days, ${count} time`,
                      `Every ${interval} weeks on all days, ${count} times`,
                      count
                  );
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Sunday, ${count} time`,
                          `Weekly on Sunday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Sunday, ${count} time`,
                          `Every ${interval} weeks on Sunday, ${count} times`,
                          count
                      );
            }
            if (startDate === 1) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Monday, ${count} time`,
                          `Weekly on Monday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Monday, ${count} time`,
                          `Every ${interval} weeks on Monday, ${count} times`,
                          count
                      );
            }
            if (startDate === 2) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Tuesday, ${count} time`,
                          `Weekly on Tuesday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Tuesday, ${count} time`,
                          `Every ${interval} weeks on Tuesday, ${count} times`,
                          count
                      );
            }
            if (startDate === 3) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Wednesday, ${count} time`,
                          `Weekly on Wednesday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Wednesday, ${count} time`,
                          `Every ${interval} weeks on Wednesday, ${count} times`,
                          count
                      );
            }
            if (startDate === 4) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Thursday, ${count} time`,
                          `Weekly on Thursday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Thursday, ${count} time`,
                          `Every ${interval} weeks on Thursday, ${count} times`,
                          count
                      );
            }
            if (startDate === 5) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Friday, ${count} time`,
                          `Weekly on Friday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Friday, ${count} time`,
                          `Every ${interval} weeks on Friday, ${count} times`,
                          count
                      );
            }
            if (startDate === 6) {
                return interval === 1
                    ? c('Weekly recurring event, frequency').ngettext(
                          msgid`Weekly on Saturday, ${count} time`,
                          `Weekly on Saturday, ${count} times`,
                          count
                      )
                    : c('Weekly recurring event, frequency').ngettext(
                          msgid`Every ${interval} weeks on Saturday, ${count} time`,
                          `Every ${interval} weeks on Saturday, ${count} times`,
                          count
                      );
            }
        }
        return interval === 1
            ? c('Weekly recurring event, frequency').ngettext(
                  msgid`Weekly on ${multipleDaysString}, ${count} time`,
                  `Weekly on ${multipleDaysString}, ${count} times`,
                  count
              )
            : c('Weekly recurring event, frequency').ngettext(
                  msgid`Every ${interval} weeks on ${multipleDaysString}, ${count} time`,
                  `Every ${interval} weeks on ${multipleDaysString}, ${count} times`,
                  count
              );
    }
    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        if (days.length === 7) {
            return c('Weekly recurring event, frequency').ngettext(
                msgid`Weekly on all days, until ${dateString}`,
                `Every ${interval} weeks on all days, until ${dateString}`,
                interval
            );
        }
        if (days.length === 1) {
            const startDate = days[0];
            if (startDate === 0) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Sunday, until ${dateString}`,
                    `Every ${interval} weeks on Sunday, until ${dateString}`,
                    interval
                );
            }
            if (startDate === 1) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Monday, until ${dateString}`,
                    `Every ${interval} weeks on Monday, until ${dateString}`,
                    interval
                );
            }
            if (startDate === 2) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Tuesday, until ${dateString}`,
                    `Every ${interval} weeks on Tuesday, until ${dateString}`,
                    interval
                );
            }
            if (startDate === 3) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Wednesday, until ${dateString}`,
                    `Every ${interval} weeks on Wednesday, until ${dateString}`,
                    interval
                );
            }
            if (startDate === 4) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Thursday, until ${dateString}`,
                    `Every ${interval} weeks on Thursday, until ${dateString}`,
                    interval
                );
            }
            if (startDate === 5) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Friday, until ${dateString}`,
                    `Every ${interval} weeks on Friday, until ${dateString}`,
                    interval
                );
            }
            if (startDate === 6) {
                return c('Weekly recurring event, frequency').ngettext(
                    msgid`Weekly on Saturday, until ${dateString}`,
                    `Every ${interval} weeks on Saturday, until ${dateString}`,
                    interval
                );
            }
        }
        return c('Weekly recurring event, frequency').ngettext(
            msgid`Weekly on ${multipleDaysString}, until ${dateString}`,
            `Every ${interval} weeks on ${multipleDaysString}, until ${dateString}`,
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
        return c('Monthly recurring event, frequency').ngettext(
            msgid`Monthly ${onDayString}`,
            `Every ${interval} months ${onDayString}`,
            interval
        );
    }
    if (endType === END_TYPE.AFTER_N_TIMES) {
        return interval === 1
            ? c('Monthly recurring event, frequency').ngettext(
                  msgid`Monthly ${onDayString}, ${count} time`,
                  `Monthly ${onDayString}, ${count} times`,
                  count
              )
            : c('Monthly recurring event, frequency').ngettext(
                  msgid`Every ${interval} months ${onDayString}, ${count} time`,
                  `Every ${interval} months ${onDayString}, ${count} times`,
                  count
              );
    }
    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        return c('Monthly recurring event, frequency').ngettext(
            msgid`Monthly ${onDayString}, until ${dateString}`,
            `Every ${interval} months ${onDayString}, until ${dateString}`,
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
        return c('Yearly recurring event, frequency').ngettext(msgid`Yearly`, `Every ${interval} years`, interval);
    }

    if (endType === END_TYPE.AFTER_N_TIMES) {
        return interval === 1
            ? c('Yearly recurring event, frequency').ngettext(
                  msgid`Yearly, ${count} time`,
                  `Yearly, ${count} times`,
                  count
              )
            : c('Yearly recurring event, frequency').ngettext(
                  msgid`Every ${interval} years, ${count} time`,
                  `Every ${interval} years, ${count} times`,
                  count
              );
    }

    if (endType === END_TYPE.UNTIL && until) {
        const dateString = format(until, 'PP', { locale });
        return c('Yearly recurring event, frequency').ngettext(
            msgid`Yearly, until ${dateString}`,
            `Every ${interval} years, until ${dateString}`,
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

    const isCustom = getIsRruleCustom(rruleValue);
    const isSupported = getIsRruleSupported(rruleValue);
    const startFakeUtcDate = toUTCDate(dtstart.value);
    const startDay = startFakeUtcDate.getUTCDay();
    const end = {
        type: getEndType(count, until),
        count,
        until: getUntilDate(until),
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
        // if (frequency === FREQUENCY.YEARLY) {
        //     return true;
        // }
        if (freq === FREQUENCY.MONTHLY) {
            return true;
        }
        return false;
    })();

    const timezoneString = isTimezoneStringNeeded ? ` (${startTzid})` : '';
    return getFrequencyString(rruleValue, dtstart, options) + timezoneString;
};
