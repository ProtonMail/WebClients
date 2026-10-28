import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

interface DateFormatOptions {
    month: 'short' | 'long';
    withYear: boolean;
    withWeekday?: boolean;
    timeZone?: string;
}

const getExplicitPattern = (
    dateFormat: Exclude<SETTINGS_DATE_FORMAT, SETTINGS_DATE_FORMAT.LOCALE_DEFAULT>,
    { month, withYear }: DateFormatOptions
): string => {
    const monthToken = month === 'short' ? 'MMM' : 'MMMM';
    switch (dateFormat) {
        case SETTINGS_DATE_FORMAT.DDMMYYYY:
            return `d ${monthToken}${withYear ? ', yyyy' : ''}`;
        case SETTINGS_DATE_FORMAT.MMDDYYYY:
            return `${monthToken} d${withYear ? ', yyyy' : ''}`;
        case SETTINGS_DATE_FORMAT.YYYYMMDD:
            return `${withYear ? 'yyyy, ' : ''}${monthToken} d`;
        default: {
            const unhandled: never = dateFormat;
            return unhandled;
        }
    }
};

export const formatDateForSetting = (date: Date, dateFormat: SETTINGS_DATE_FORMAT, options: DateFormatOptions) => {
    const { month, withYear, withWeekday = false, timeZone } = options;

    if (dateFormat === SETTINGS_DATE_FORMAT.LOCALE_DEFAULT) {
        return new Intl.DateTimeFormat(dateLocale.code, {
            timeZone,
            month,
            day: 'numeric',
            ...(withWeekday ? { weekday: 'short' } : {}),
            ...(withYear ? { year: 'numeric' } : {}),
        }).format(date);
    }

    const pattern = `${withWeekday ? 'EEE, ' : ''}${getExplicitPattern(dateFormat, options)}`;
    return timeZone
        ? formatInTimeZone(date, timeZone, pattern, { locale: dateLocale })
        : format(date, pattern, { locale: dateLocale });
};
