import { default as enGBLocale } from 'date-fns/locale/en-GB';
import { default as enUSLocale } from 'date-fns/locale/en-US';
import { default as faIRLocale } from 'date-fns/locale/fa-IR';

import type { DateFnsLocaleMap } from '../interfaces/Locale';

const dateFnLocales = import.meta.webpackContext!('date-fns/locale', {
    recursive: true,
    regExp: /^\.\/[a-z]{2}(-([A-Z]{2}))?\/index\.js$/,
    mode: 'lazy',
    chunkName: 'date-fns/[request]',
});

const dateFnsLocaleMap = dateFnLocales.keys().reduce((acc: DateFnsLocaleMap, key: string) => {
    const end = key.lastIndexOf('/');
    const normalizedKey = key.slice(2, end).replace('-', '_');
    acc[normalizedKey] = () => dateFnLocales(key);
    return acc;
}, {});

export { enUSLocale };
export { enGBLocale };
export { faIRLocale };

export const getDateFnLocale = (value: string) => {
    if (value === 'en_US') {
        return enUSLocale;
    }
    if (value === 'en_GB') {
        return enGBLocale;
    }
    if (value === 'fa_IR') {
        return faIRLocale;
    }
    return dateFnsLocaleMap[value]();
};

export default dateFnsLocaleMap;
