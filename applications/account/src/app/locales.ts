import { createLocaleMap } from '@proton/shared/lib/i18n/locales';

const locales = createLocaleMap(
    (locale) => import(/* webpackChunkName: "locales/[request]" */ `../../locales/${locale}.json`)
);

export default locales;
