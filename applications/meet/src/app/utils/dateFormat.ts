import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';

export const getExplicitDateFormatPattern = (
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
