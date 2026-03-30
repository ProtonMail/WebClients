import { createLocaleMap } from '@proton/shared/lib/i18n/locales';

export const locales = createLocaleMap(
    (locale) => import(/* webpackChunkName: "locales/[request]" */ `../../locales/${locale}.json`)
);
