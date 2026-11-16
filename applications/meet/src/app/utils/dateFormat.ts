import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { formatInTimeZone, formatIntlInTimeZone } from './zonedTime';

interface DateFormatOptions {
    month: 'short' | 'long';
    withYear: boolean;
    withWeekday?: boolean;
    timeZone: string;
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
        return formatIntlInTimeZone(
            date,
            timeZone,
            {
                month,
                day: 'numeric',
                ...(withWeekday ? { weekday: 'short' } : {}),
                ...(withYear ? { year: 'numeric' } : {}),
            },
            dateLocale.code
        );
    }

    const pattern = `${withWeekday ? 'EEE, ' : ''}${getExplicitPattern(dateFormat, options)}`;
    return formatInTimeZone(date, timeZone, pattern, { locale: dateLocale });
};
