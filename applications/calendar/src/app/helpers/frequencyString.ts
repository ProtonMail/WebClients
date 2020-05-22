import { format } from 'date-fns';
import { mod } from 'proton-shared/lib/helpers/math';
import { c, msgid } from 'ttag';
import { END_TYPE, FREQUENCY, MONTHLY_TYPE } from '../constants';
import { WeekStartsOn } from '../containers/calendar/interface';
import { FrequencyModel } from '../interfaces/EventModel';
import { getPositiveSetpos } from './rrule';

interface GetTimezonedFrequencyStringOptions {
    date: Date;
    startTzid: string;
    currentTzid: string;
    locale: Locale;
    weekStartsOn: WeekStartsOn;
}
// NOTE: due to the different grammar of different languages, to allow for a proper translation,
// we need to expand all possible cases so there will be quite a bit of duplicated code

export const getOnDayString = (date: Date, monthlyType: MONTHLY_TYPE) => {
    const monthday = date.getDate();
    const day = date.getDay();

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
    return c('Monthly recurring event, repeats on').t`on day ${monthday}`;
};

const getCustomDailyString = (
    { interval = 1, ends: { type: endType, until, count = 1 } }: FrequencyModel,
    locale: Locale
) => {
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
        const dateString = format(until, 'd MMM yyyy', { locale });
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
    { interval = 1, weekly: { days }, ends: { type: endType, until, count = 1 } }: FrequencyModel,
    weekStartsOn: WeekStartsOn,
    locale: Locale
) => {
    // sort weekly days depending on the day the week starts
    const sortedWeekDays = days.slice().sort((a: number, b: number) => {
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
        const dateString = format(until, 'd MMM yyyy', { locale });
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
    { interval = 1, monthly, ends: { type: endType, until, count = 1 } }: FrequencyModel,
    date: Date,
    locale: Locale
) => {
    const onDayString = date ? getOnDayString(date, monthly.type) : '';
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
        const dateString = format(until, 'd MMM yyyy', { locale });
        return c('Monthly recurring event, frequency').ngettext(
            msgid`Monthly ${onDayString}, until ${dateString}`,
            `Every ${interval} months ${onDayString}, until ${dateString}`,
            interval
        );
    }
};

const getCustomYearlyString = (
    { interval = 1, ends: { type: endType, until, count = 1 } }: FrequencyModel,
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
        const dateString = format(until, 'd MMM yyyy', { locale });
        return c('Yearly recurring event, frequency').ngettext(
            msgid`Yearly, until ${dateString}`,
            `Every ${interval} years, until ${dateString}`,
            interval
        );
    }
};

const getFrequencyString = (
    frequencyModel: FrequencyModel,
    { date, weekStartsOn, locale }: GetTimezonedFrequencyStringOptions
) => {
    const { type, frequency, weekly, monthly } = frequencyModel;
    const startDay = weekly.days[0];

    if (type === FREQUENCY.DAILY) {
        return c('Info').t`Daily`;
    }
    if (type === FREQUENCY.WEEKLY) {
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
    if (type === FREQUENCY.MONTHLY) {
        const onDayString = date ? getOnDayString(date, monthly.type) : '';
        return c('Info').t`Monthly ${onDayString}`;
    }
    if (type === FREQUENCY.YEARLY) {
        return c('Info').t`Yearly`;
    }
    if (type === FREQUENCY.CUSTOM) {
        if (frequency === FREQUENCY.DAILY) {
            return getCustomDailyString(frequencyModel, locale);
        }
        if (frequency === FREQUENCY.WEEKLY) {
            return getCustomWeeklyString(frequencyModel, weekStartsOn, locale);
        }
        if (frequency === FREQUENCY.MONTHLY) {
            return getCustomMonthlyString(frequencyModel, date, locale);
        }
        if (frequency === FREQUENCY.YEARLY) {
            return getCustomYearlyString(frequencyModel, locale);
        }
    }
    return '';
};

export const getTimezonedFrequencyString = (
    frequencyModel: FrequencyModel,
    options: GetTimezonedFrequencyStringOptions
) => {
    const {
        type,
        frequency,
        weekly: { days },
        ends: { type: endType },
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
