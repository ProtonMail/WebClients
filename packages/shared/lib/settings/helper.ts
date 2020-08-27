import { browserDateLocale } from '../i18n';
import { SETTINGS_TIME_FORMAT, SETTINGS_WEEK_START, UserSettings } from '../interfaces';
import { WeekStartsOn } from '../date-fns-utc/interface';
import { getIsLocaleAMPM } from '../i18n/dateFnLocale';

export const getDefaultDateFormat = () => {
    return browserDateLocale.formatLong?.date({ width: 'short' });
};

export const getDefaultTimeFormat = () => {
    const isAMPM = getIsLocaleAMPM(browserDateLocale);
    return isAMPM ? SETTINGS_TIME_FORMAT.H12 : SETTINGS_TIME_FORMAT.H24;
};

export const getDefaultWeekStartsOn = (): WeekStartsOn => {
    const localeWeekStartsOn = browserDateLocale?.options?.weekStartsOn;
    if (localeWeekStartsOn !== undefined && localeWeekStartsOn >= 0 && localeWeekStartsOn <= 6) {
        return localeWeekStartsOn;
    }
    return 0;
};

export const getWeekStartsOn = ({ WeekStart }: Pick<UserSettings, 'WeekStart'>): WeekStartsOn => {
    if (WeekStart === SETTINGS_WEEK_START.LOCALE_DEFAULT) {
        return getDefaultWeekStartsOn();
    }
    if (WeekStart >= 1 && WeekStart <= 7) {
        return (WeekStart % 7) as WeekStartsOn;
    }
    return 0;
};
