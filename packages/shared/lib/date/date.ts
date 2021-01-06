import {
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfYear,
    format,
    addMonths,
    sub,
    isAfter,
    getDaysInMonth,
} from 'date-fns';

interface FormatOptions {
    locale?: Locale;
}

/**
 * Get a list with the names of the days of the week according to current locale, where Sunday is the start of the week.
 */
export const getFormattedWeekdays = (stringFormat: string, options?: FormatOptions) => {
    const zeroTime = new Date(0);
    const weekdays = eachDayOfInterval({ start: startOfWeek(zeroTime), end: endOfWeek(zeroTime) });

    return weekdays.map((day) => format(day, stringFormat, options));
};

/**
 * Get a list with the names of the days of the week according to current locale
 */
export const getFormattedMonths = (stringFormat: string, options?: FormatOptions) => {
    const dummyDate = startOfYear(new Date(0));
    const dummyMonths = Array.from({ length: 12 }).map((_, i) => addMonths(dummyDate, i));

    return dummyMonths.map((date) => format(date, stringFormat, options));
};

/**
 * Get the index of the start of week day for a given date-fn locale
 */
export const getWeekStartsOn = ({ options: { weekStartsOn = 0 } = { weekStartsOn: 0 } }: Locale) => weekStartsOn;

export const getTimeRemaining = (earlierDate: Date, laterDate: Date) => {
    const result = {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        firstDateWasLater: false,
    };

    if (earlierDate === laterDate) {
        return result;
    }

    let earlier;
    let later;
    if (isAfter(earlierDate, laterDate)) {
        later = earlierDate;
        earlier = laterDate;
        result.firstDateWasLater = true;
    } else {
        earlier = earlierDate;
        later = laterDate;
    }

    result.years = later.getFullYear() - earlier.getFullYear();
    result.months = later.getMonth() - earlier.getMonth();
    result.days = later.getDate() - earlier.getDate();
    result.hours = later.getHours() - earlier.getHours();
    result.minutes = later.getMinutes() - earlier.getMinutes();
    result.seconds = later.getSeconds() - earlier.getSeconds();

    if (result.seconds < 0) {
        result.seconds += 60;
        result.minutes--;
    }

    if (result.minutes < 0) {
        result.minutes += 60;
        result.hours--;
    }

    if (result.hours < 0) {
        result.hours += 24;
        result.days--;
    }

    if (result.days < 0) {
        const daysInLastFullMonth = getDaysInMonth(
            sub(new Date(`${later.getFullYear()}-${later.getMonth() + 1}`), { months: 1 })
        );
        if (daysInLastFullMonth < earlier.getDate()) {
            // 31/01 -> 2/03
            result.days += daysInLastFullMonth + (earlier.getDate() - daysInLastFullMonth);
        } else {
            result.days += daysInLastFullMonth;
        }
        result.months--;
    }

    if (result.months < 0) {
        result.months += 12;
        result.years--;
    }

    return result;
};
