import { DateFnsLocaleMap } from '../interfaces/Locale';

const dateFnLocales = require.context('date-fns/locale', true, /^\.\/[a-z]{2}(-([A-Z]{2}))?\/index\.js$/, 'lazy');

export default dateFnLocales.keys().reduce((acc: DateFnsLocaleMap, key: string) => {
    const end = key.lastIndexOf('/');
    const normalizedKey = key.slice(2, end).replace('-', '_');
    acc[normalizedKey] = () => dateFnLocales(key);
    return acc;
}, {});

export { default as enUSLocale } from 'date-fns/locale/en-US';
export { default as enGBLocale } from 'date-fns/locale/en-GB';
