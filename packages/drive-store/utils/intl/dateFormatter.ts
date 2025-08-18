import { dateLocale } from '@proton/shared/lib/i18n';

type FormatterCache = { code?: string; formatter?: Intl.DateTimeFormat };

// Creating Intl.DateTimeFormat objects is expensive, so we have a local cache
// Since dateLocale can mutate, we update it when the code updates.

const monthFormatterCache: FormatterCache = {};
const monthYearFormatterCache: FormatterCache = {};

const getCachedFormatter = (cache: FormatterCache, options: Intl.DateTimeFormatOptions) => {
    if (cache.code !== dateLocale.code || !cache.formatter) {
        cache.code = dateLocale.code;
        cache.formatter = new Intl.DateTimeFormat(dateLocale.code, options);
    }

    return cache.formatter;
};

/**
 * A cached Intl.DateTimeFormat object that ouptuts month names
 *
 * e.g. `January`
 */
export const getMonthFormatter = () => getCachedFormatter(monthFormatterCache, { month: 'long' });

/**
 * A cached Intl.DateTimeFormat object that outputs month names with the year attached
 *
 * e.g. `January 1970`
 */
export const getMonthYearFormatter = () =>
    getCachedFormatter(monthYearFormatterCache, { month: 'long', year: 'numeric' });
