import { addLocale, useLocale as activateLocale } from 'ttag'
import { demoTranslations } from './demoTranslations'
import { createSheetsMessages } from '../../app/Containers/adapters/sheets/sheetsMessages/createSheetsMessages'

type CompactCatalog = {
  headers: Record<string, string>
  contexts: Record<string, Record<string, string[]>>
}

/** The demo host loads catalogs; the editor only receives the complete typed object. */
export async function loadDemoMessageFactory(locale: 'fr-FR' | 'de-DE') {
  const catalog =
    locale === 'fr-FR'
      ? (await import('../../../locales/fr_FR.json')).default
      : (await import('../../../locales/de_DE.json')).default
  // Activate only after the caller confirms this is still the latest request.
  return () => createDemoMessages(locale, catalog)
}

function createDemoMessages(locale: string, catalog: CompactCatalog) {
  const contexts = { ...catalog.contexts }
  const languageIndex = ({ 'fr-FR': 0, 'de-DE': 1 } as const)[locale as 'fr-FR' | 'de-DE']
  if (languageIndex !== undefined) {
    for (const [context, entries] of Object.entries(demoTranslations)) {
      contexts[context] = { ...contexts[context] }
      for (const [source, translations] of Object.entries(entries)) {
        contexts[context][source] = [translations[languageIndex]]
      }
    }
  }
  addLocale(locale, { ...catalog, contexts, charset: 'utf-8' })
  activateLocale(locale)
  return createSheetsMessages()
}
