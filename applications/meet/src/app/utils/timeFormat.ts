import { format, isValid, parse } from 'date-fns';

import formatUTC from '@proton/shared/lib/date-fns-utc/format';
import { dateLocale } from '@proton/shared/lib/i18n';
import { getDateFnLocaleWithTimeFormat } from '@proton/shared/lib/i18n/dateFnLocale';
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

export const shouldUse12HourClock = (timeFormat: SETTINGS_TIME_FORMAT) => {
    const locale = dateLocale.code || 'en-US';
    return (
        timeFormat === SETTINGS_TIME_FORMAT.H12 ||
        (timeFormat === SETTINGS_TIME_FORMAT.LOCALE_DEFAULT && locale.includes('en-US'))
    );
};

const getTimeLocale = (timeFormat: SETTINGS_TIME_FORMAT) =>
    getDateFnLocaleWithTimeFormat(dateLocale, shouldUse12HourClock(timeFormat));

export const formatTimeHHMM = (hours: number, minutes: number, timeFormat: SETTINGS_TIME_FORMAT): string =>
    formatUTC(new Date(Date.UTC(1970, 0, 1, hours, minutes)), 'p', { locale: getTimeLocale(timeFormat) });

export const parseTimeHHMM = (text: string, timeFormat: SETTINGS_TIME_FORMAT): string | null => {
    const locale = getTimeLocale(timeFormat);
    const time = parse(text, 'p', new Date(1970, 0, 1), { locale });
    return isValid(time) ? format(time, 'HH:mm', { locale }) : null;
};
