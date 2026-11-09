import type { dateLocale } from '@proton/shared/lib/i18n'
import type { DocsDateFormat } from '@proton-docs/docs-editor'

/** A date-fns time format with a day period token ('a' or 'b') is a 12-hour clock. */
const DayPeriodPattern = /a|b/

export function toDocsDateFormat(locale: typeof dateLocale): DocsDateFormat {
  return {
    localeCode: locale.code ?? 'en-US',
    hourCycle: DayPeriodPattern.test(locale.formatLong?.time() ?? '') ? 'h12' : 'h23',
  }
}
