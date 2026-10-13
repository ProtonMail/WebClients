import { useEffect, useMemo, useState } from 'react'
import { localeCode, subscribeToLocaleChange } from '@proton/shared/lib/i18n'
import { getIntlLocale } from '@proton/shared/lib/i18n/helper'
import { resolveDefaultWorkbookLocale } from '../../Spreadsheet/public'
import { createSheetsMessages } from './sheetsMessages/createSheetsMessages'

/** Rebuild host messages and workbook Auto preferences when the account locale changes. */
export function useSheetsLocalization() {
  const [messages, setMessages] = useState(createSheetsMessages)
  const [uiLocale, setUiLocale] = useState(() => getIntlLocale(localeCode).toLowerCase())
  useEffect(() => {
    const refresh = (nextLocaleCode: string) => {
      setMessages(createSheetsMessages())
      setUiLocale(getIntlLocale(nextLocaleCode).toLowerCase())
    }
    const unsubscribe = subscribeToLocaleChange(({ localeCode: nextLocaleCode }) => refresh(nextLocaleCode))
    // A locale can activate after render but before this subscription is installed.
    if (getIntlLocale(localeCode).toLowerCase() !== uiLocale) {
      refresh(localeCode)
    }
    return unsubscribe
  }, [uiLocale])
  const localization = useMemo(
    () => ({
      uiLocale,
      defaultWorkbookLocale: resolveDefaultWorkbookLocale(uiLocale, navigator.languages),
    }),
    [uiLocale],
  )
  return { messages, localization }
}
