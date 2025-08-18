import { dateLocale } from '@proton/shared/lib/i18n';

type FormatterCache = { code?: string; formatter?: Intl.NumberFormat };

// Creating Intl.NumberFormat objects is expensive, so we have a local cache
// Since dateLocale can mutate, we update it when the code updates.

const percentageFormatterCache: FormatterCache = {};

const getCachedFormatter = (cache: FormatterCache, options: Intl.NumberFormatOptions) => {
    if (cache.code !== dateLocale.code || !cache.formatter) {
        cache.code = dateLocale.code;
        cache.formatter = new Intl.NumberFormat(dateLocale.code, options);
    }

    return cache.formatter;
};

/**
 * A cached Intl.NumberFormat object that ouptuts month names
 *
 * e.g. `50%`
 */
export const getPercentageFormatter = () => getCachedFormatter(percentageFormatterCache, { style: 'percent' });
