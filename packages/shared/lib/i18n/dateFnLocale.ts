import { Locale } from 'date-fns';
import { enGBLocale, enUSLocale, faIRLocale } from './dateFnLocales';
import { SETTINGS_DATE_FORMAT, SETTINGS_TIME_FORMAT, SETTINGS_WEEK_START } from '../interfaces';

// Support for changing the date format is not great. Hide it for now.
export const IS_DATE_FORMAT_ENABLED = false;

export const getDateFnLocaleWithLongFormat = (a: Locale, b: Locale): Locale => {
    /*
     * By default we use the same date-time locale as the user has selected in the app in order
     * to get the correct translations for days, months, year, etc. However, we override
     * the long date and time format to get 12 or 24 hour time and the correct date format depending
     * on what is selected in the browser for the "system settings" option.
     */
    if (!b.formatLong?.time || !a.formatLong) {
        return a;
    }
    return {
        ...a,
        formatLong: {
            ...a.formatLong,
            time: b.formatLong.time,
        },
    };
};

export interface Options {
    TimeFormat: SETTINGS_TIME_FORMAT;
    DateFormat: SETTINGS_DATE_FORMAT;
    WeekStart: SETTINGS_WEEK_START;
}

export const getIsLocaleAMPM = (locale: Locale) => locale.formatLong?.time().includes('a');

export const getDateFnLocaleWithDateFormat = (locale: Locale, dateFormat: SETTINGS_DATE_FORMAT): Locale => {
    const date = (dateFormat === SETTINGS_DATE_FORMAT.DDMMYYYY
        ? enGBLocale
        : dateFormat === SETTINGS_DATE_FORMAT.MMDDYYYY
        ? enUSLocale
        : faIRLocale
    ).formatLong?.date;

    return {
        ...locale,
        formatLong: {
            ...locale.formatLong,
            // @ts-ignore
            date,
        },
    };
};

export const getDateFnLocaleWithTimeFormat = (dateLocale: Locale, displayAMPM = false): Locale => {
    const isAMPMLocale = getIsLocaleAMPM(dateLocale);
    if ((displayAMPM && isAMPMLocale) || (!displayAMPM && !isAMPMLocale)) {
        return dateLocale;
    }

    const time = (displayAMPM ? enUSLocale : enGBLocale).formatLong?.time;

    return {
        ...dateLocale,
        formatLong: {
            ...dateLocale.formatLong,
            // @ts-ignore
            time,
        },
    };
};

export const getDateFnLocaleWithSettings = (
    locale: Locale,
    {
        TimeFormat = SETTINGS_TIME_FORMAT.LOCALE_DEFAULT,
        DateFormat = SETTINGS_DATE_FORMAT.LOCALE_DEFAULT,
        WeekStart = SETTINGS_WEEK_START.LOCALE_DEFAULT,
    }: Partial<Options> = {}
) => {
    let copy: Locale = {
        ...locale,
    };

    if (TimeFormat !== SETTINGS_TIME_FORMAT.LOCALE_DEFAULT) {
        const displayAMPM = TimeFormat === SETTINGS_TIME_FORMAT.H12;
        copy = getDateFnLocaleWithTimeFormat(locale, displayAMPM);
    }

    if (IS_DATE_FORMAT_ENABLED && DateFormat !== SETTINGS_DATE_FORMAT.LOCALE_DEFAULT) {
        copy = getDateFnLocaleWithDateFormat(copy, DateFormat);
    }

    if (WeekStart !== SETTINGS_WEEK_START.LOCALE_DEFAULT && WeekStart >= 1 && WeekStart <= 7) {
        copy.options = {
            ...copy.options,
            weekStartsOn: (WeekStart % 7) as any,
        };
    }

    return copy;
};
