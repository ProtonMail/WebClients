import { useEffect, useRef, useState } from 'react'
import { useLocale as activateLocale } from 'ttag'
import type { SheetsMessages } from '../../app/Containers/Spreadsheet/public'
import { loadDemoMessageFactory } from './demoMessages'

export function useDemoLocalization() {
  const [uiLocale, setUiLocale] = useState('en-US')
  const [messages, setMessages] = useState<SheetsMessages>()
  const [languageStatus, setLanguageStatus] = useState('')
  const languageRequest = useRef(0)
  useEffect(
    () => () => {
      languageRequest.current += 1
    },
    [],
  )
  async function changeLanguage(locale: string) {
    if (locale !== 'en-US' && locale !== 'fr-FR' && locale !== 'de-DE') {
      return
    }
    const request = ++languageRequest.current
    setLanguageStatus('Loading translations…')
    try {
      const next = locale === 'en-US' ? undefined : await loadDemoMessageFactory(locale)
      if (request !== languageRequest.current) {
        return
      }
      if (locale === 'en-US') {
        activateLocale('en')
      }
      setMessages(next?.())
      setUiLocale(locale)
      setLanguageStatus('')
    } catch (error) {
      if (request !== languageRequest.current) {
        return
      }
      setLanguageStatus('Could not load translations. Previous language retained.')
      console.error(error)
    }
  }
  return { uiLocale, messages, languageStatus, changeLanguage }
}
