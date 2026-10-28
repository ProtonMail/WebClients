import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

type DateOrder = 'dayFirst' | 'monthFirst' | 'yearFirst';

const getDateOrderFromLocale = (): DateOrder => {
    const shortPattern = dateLocale.formatLong?.date({ width: 'short' }) ?? '';
    const firstLetter = shortPattern.match(/[a-zA-Z]/)?.[0];
    switch (firstLetter) {
        case 'd':
            return 'dayFirst';
        case 'y':
            return 'yearFirst';
        default:
            return 'monthFirst';
    }
};

const getDateOrder = (dateFormat: SETTINGS_DATE_FORMAT): DateOrder => {
    switch (dateFormat) {
        case SETTINGS_DATE_FORMAT.DDMMYYYY:
            return 'dayFirst';
        case SETTINGS_DATE_FORMAT.MMDDYYYY:
            return 'monthFirst';
        case SETTINGS_DATE_FORMAT.YYYYMMDD:
            return 'yearFirst';
        default:
            return getDateOrderFromLocale();
    }
};

export const getDateFormatPattern = (
    dateFormat: SETTINGS_DATE_FORMAT,
    { month, withYear }: { month: 'MMM' | 'MMMM'; withYear: boolean }
): string => {
    switch (getDateOrder(dateFormat)) {
        case 'dayFirst':
            return `d ${month}${withYear ? ', yyyy' : ''}`;
        case 'yearFirst':
            return `${withYear ? 'yyyy, ' : ''}${month} d`;
        case 'monthFirst':
            return `${month} d${withYear ? ', yyyy' : ''}`;
    }
};
