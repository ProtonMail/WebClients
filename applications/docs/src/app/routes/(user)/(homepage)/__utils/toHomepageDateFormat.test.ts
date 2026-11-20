import { getDateFnLocaleWithTimeFormat } from '@proton/shared/lib/i18n/dateFnLocale'
import { enGBLocale, enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales'

import { toHomepageDateFormat } from './toHomepageDateFormat'

it.each([
  ['en-US', enUSLocale, 'h12'],
  ['en-GB', enGBLocale, 'h23'],
])('formats dates for %s with its clock', (localeCode, locale, hourCycle) => {
  expect(toHomepageDateFormat(locale)).toEqual({ localeCode, hourCycle })
})

it("follows the account's time format over the locale's", () => {
  expect(toHomepageDateFormat(getDateFnLocaleWithTimeFormat(enUSLocale, false))).toEqual({
    localeCode: 'en-US',
    hourCycle: 'h23',
  })
  expect(toHomepageDateFormat(getDateFnLocaleWithTimeFormat(enGBLocale, true))).toEqual({
    localeCode: 'en-GB',
    hourCycle: 'h12',
  })
})
