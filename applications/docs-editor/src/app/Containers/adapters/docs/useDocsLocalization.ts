import { useEffect, useState } from 'react'
import { localeCode, subscribeToLocaleChange } from '@proton/shared/lib/i18n'
import { createDocsMessages } from './docsMessages/createDocsMessages'

function createLocalizedMessages() {
  return { localeCode, messages: createDocsMessages() }
}

/**
 * Rebuild host messages when the account locale's translations activate.
 * `Application.subscribeToLocale` fires before `loadLocales` has loaded the catalogue, so it is too early.
 */
export function useDocsLocalization() {
  const [localized, setLocalized] = useState(createLocalizedMessages)
  useEffect(() => {
    const refresh = () => setLocalized(createLocalizedMessages())
    const unsubscribe = subscribeToLocaleChange(refresh)
    // A locale can activate after render but before this subscription is installed.
    if (localeCode !== localized.localeCode) {
      refresh()
    }
    return unsubscribe
  }, [localized.localeCode])
  return localized.messages
}
