import { useEffect, useState } from 'react'

import { localeCode, subscribeToLocaleChange } from '@proton/shared/lib/i18n'

import { createHomepageMessages } from './homepageMessages/createHomepageMessages'

// Copied from applications/docs-editor/src/app/Containers/adapters/docs/useDocsLocalization.ts.
function createLocalizedMessages() {
  return { localeCode, messages: createHomepageMessages() }
}

/**
 * Rebuild the homepage messages when the account locale's translations activate.
 */
export function useHomepageLocalization() {
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
