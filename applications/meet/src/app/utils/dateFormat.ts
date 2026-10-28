import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';

/**
 * Returns a date-fns pattern ordering day, month and year as set in the user's date format setting,
 * or null when the setting is the locale default and the locale order should be used instead.
 */
export const getMonthDayPattern = (
    dateFormat: SETTINGS_DATE_FORMAT,
    { month, withYear }: { month: 'MMM' | 'MMMM'; withYear: boolean }
): string | null => {
    switch (dateFormat) {
        case SETTINGS_DATE_FORMAT.DDMMYYYY:
            return `d ${month}${withYear ? ', yyyy' : ''}`;
        case SETTINGS_DATE_FORMAT.MMDDYYYY:
            return `${month} d${withYear ? ', yyyy' : ''}`;
        case SETTINGS_DATE_FORMAT.YYYYMMDD:
            return `${withYear ? 'yyyy, ' : ''}${month} d`;
        default:
            return null;
    }
};
