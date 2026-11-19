import { act, renderHook } from '@testing-library/react'
import { addLocale, useLocale } from 'ttag'

import { setLocales } from '@proton/shared/lib/i18n'

import { useHomepageLocalization } from './useHomepageLocalization'

addLocale('fr', {
  charset: 'utf-8',
  headers: { 'plural-forms': 'nplurals=2; plural=(n > 1);' },
  contexts: { 'Page title': { Recents: ['Récents'] } },
})

afterEach(() => {
  useLocale('en')
  setLocales({ localeCode: 'en_US', languageCode: 'en' })
})

it('translates the messages again once the account locale activates', () => {
  const { result } = renderHook(() => useHomepageLocalization())
  expect(result.current.pageTitle.recents).toBe('Recents')

  act(() => {
    useLocale('fr')
    setLocales({ localeCode: 'fr_FR', languageCode: 'fr' })
  })

  expect(result.current.pageTitle.recents).toBe('Récents')
})
