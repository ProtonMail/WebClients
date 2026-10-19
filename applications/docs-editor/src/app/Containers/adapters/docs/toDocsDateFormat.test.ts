import { getDateFnLocaleWithSettings } from '@proton/shared/lib/i18n/dateFnLocale'
import { enGBLocale, enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales'
import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces'
import { toDocsDateFormat } from './toDocsDateFormat'

describe('toDocsDateFormat', () => {
  it("follows the locale's own clock by default", () => {
    expect(toDocsDateFormat(enUSLocale)).toEqual({ localeCode: 'en-US', hourCycle: 'h12' })
    expect(toDocsDateFormat(enGBLocale)).toEqual({ localeCode: 'en-GB', hourCycle: 'h23' })
  })

  it("follows the account's time format setting over the locale's clock", () => {
    const usWith24Hours = getDateFnLocaleWithSettings(enUSLocale, { TimeFormat: SETTINGS_TIME_FORMAT.H24 })
    const britishWith12Hours = getDateFnLocaleWithSettings(enGBLocale, { TimeFormat: SETTINGS_TIME_FORMAT.H12 })
    expect(toDocsDateFormat(usWith24Hours)).toEqual({ localeCode: 'en-US', hourCycle: 'h23' })
    expect(toDocsDateFormat(britishWith12Hours)).toEqual({ localeCode: 'en-GB', hourCycle: 'h12' })
  })

  it('falls back to US English for a locale without a code', () => {
    expect(toDocsDateFormat({ ...enGBLocale, code: undefined })).toEqual({ localeCode: 'en-US', hourCycle: 'h23' })
  })
})
