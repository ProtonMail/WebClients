import { TtagLocaleMap } from '../interfaces/Locale';

const locales = require.context('proton-translations', true, /.json$/, 'lazy');

export default locales.keys().reduce<TtagLocaleMap>((acc, key) => {
    acc[key.slice(2, key.length - 5)] = () => locales(key);
    return acc;
}, {});
