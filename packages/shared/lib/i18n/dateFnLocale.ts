import { Locale } from 'date-fns';
import { enGBLocale, enUSLocale } from './dateFnLocales';
import { DateFnsLocaleMap } from '../interfaces/Locale';

interface Config {
    locale: string;
    longLocale: string;
    locales: DateFnsLocaleMap;
}

export const loadDateFnLocale = async ({ locale, longLocale, locales }: Config) => {
    const [appDateFnLocale, longDateFnLocale] = await Promise.all([locales[locale](), locales[longLocale]()]);

    /**
     * By default we use the same date-time locale as the user has selected in the app in order
     * to get the correct translations for days, months, year, etc. However, we override
     * the long date and time format to get 12 or 24 hour time and the correct date format depending
     * on what is selected in the browser since there is no settings for this in the mail application.
     */
    return {
        ...appDateFnLocale,
        formatLong: longDateFnLocale.formatLong,
    };
};

/*
 * Allow to override the long date format.
 * Primarily intended for the calendar application, where a user can override AMPM time.
 */
export const loadDateFnTimeFormat = ({
    dateLocale,
    displayAMPM = false,
}: {
    dateLocale: Locale;
    displayAMPM?: boolean;
}) => {
    const isAMPMLocale = dateLocale.formatLong?.time().includes('a');
    if ((displayAMPM && isAMPMLocale) || (!displayAMPM && !isAMPMLocale)) {
        return dateLocale;
    }

    return {
        ...dateLocale,
        formatLong: {
            ...dateLocale.formatLong,
            time: (displayAMPM ? enUSLocale : enGBLocale).formatLong?.time,
        },
    };
};

/*
 * Detect if user's machine is using military time format (24h not 12h am/pm)
 */
export const isMilitaryTime = () => !new Date().toLocaleTimeString().match(/am|pm/i);
