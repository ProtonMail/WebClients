import type { dateLocale } from '@proton/shared/lib/i18n'

import type { HomepageDateFormat } from '~/homepage'

// Copied from applications/docs-editor/src/app/Containers/adapters/docs/toDocsDateFormat.ts, which reads the clock
// from the date-fns locale as Drive's TimeIntl does: it holds the browser's time format and the account's Time format
// setting.

/** A date-fns time format with a day period token ('a' or 'b') is a 12-hour clock. */
const DayPeriodPattern = /a|b/

export function toHomepageDateFormat(locale: typeof dateLocale): HomepageDateFormat {
  return {
    localeCode: locale.code ?? 'en-US',
    hourCycle: DayPeriodPattern.test(locale.formatLong?.time({}) ?? '') ? 'h12' : 'h23',
  }
}
