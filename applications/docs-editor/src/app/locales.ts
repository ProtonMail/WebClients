import { createLocaleMap } from '@proton/shared/lib/i18n/locales'

export default createLocaleMap(
  (locale) => import(/* webpackChunkName: "locales/[request]" */ `../../locales/${locale}.json`),
)
