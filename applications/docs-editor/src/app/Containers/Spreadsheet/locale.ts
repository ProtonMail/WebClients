import { localeCode, subscribeToLocaleChange } from '@proton/shared/lib/i18n'
import { getIntlLocale } from '@proton/shared/lib/i18n/helper'
import { useEffect, useMemo, useState } from 'react'

export const CURRENCY_FALLBACK = 'USD'
export const LOCALE_FALLBACK = 'en-us'

export const LOCALE_TO_CURRENCY_MAP: Record<string, string> = {
  'ar-eg': 'EGP',
  'az-az': 'AZN',
  'be-by': 'BYN',
  'bg-bg': 'BGN',
  'bn-in': 'INR',
  'ca-es': 'EUR',
  'cs-cz': 'CZK',
  'cy-gb': 'GBP',
  'da-dk': 'DKK',
  'de-ch': 'CHF',
  'de-de': 'EUR',
  'el-gr': 'EUR',
  'en-au': 'AUD',
  'en-ca': 'CAD',
  'en-gb': 'GBP',
  'en-in': 'INR',
  'en-ie': 'EUR',
  'en-us': 'USD',
  'es-ar': 'ARS',
  'es-bo': 'BOB',
  'es-cl': 'CLP',
  'es-co': 'COP',
  'es-ec': 'USD',
  'es-es': 'EUR',
  'es-mx': 'MXN',
  'es-py': 'PYG',
  'es-uy': 'UYU',
  'es-ve': 'VES',
  'fi-fi': 'EUR',
  'fil-ph': 'PHP',
  'fr-ca': 'CAD',
  'fr-fr': 'EUR',
  'gu-in': 'INR',
  'he-il': 'ILS',
  'hr-hr': 'EUR',
  'hu-hu': 'HUF',
  'hy-am': 'AMD',
  'id-id': 'IDR',
  'it-it': 'EUR',
  'ja-jp': 'JPY',
  'ka-ge': 'GEL',
  'kk-kz': 'KZT',
  'kn-in': 'INR',
  'ko-kr': 'KRW',
  'lv-lv': 'EUR',
  'lt-lt': 'EUR',
  'ml-in': 'INR',
  'mn-mn': 'MNT',
  'mr-in': 'INR',
  'my-mm': 'MMK',
  'nb-no': 'NOK',
  'nl-nl': 'EUR',
  'nn-no': 'NOK',
  'pa-in': 'INR',
  'pl-pl': 'PLN',
  'pt-br': 'BRL',
  'pt-pt': 'EUR',
  'ro-ro': 'RON',
  'ru-ru': 'RUB',
  'sk-sk': 'EUR',
  'sl-si': 'EUR',
  'sr-rs': 'RSD',
  'sv-se': 'SEK',
  'ta-in': 'INR',
  'te-in': 'INR',
  'th-th': 'THB',
  'tr-tr': 'TRY',
  'uk-ua': 'UAH',
  'vi-vn': 'VND',
  'zh-cn': 'CNY',
  'zh-hk': 'HKD',
  'zh-tw': 'TWD',
}

export const LOCALE_SUPPORTED_LIST = Object.keys(LOCALE_TO_CURRENCY_MAP)
export const LOCALE_BROWSER_LIST = getNavigatorLanguages().filter(isSupportedLocale)

export function getCurrencyFromLocale(locale: string) {
  return LOCALE_TO_CURRENCY_MAP[locale] ?? CURRENCY_FALLBACK
}

const LABEL_NEEDS_LANGUAGE = [
  'en-ca',
  'fr-ca',
  'bn-in',
  'gu-in',
  'kn-in',
  'ml-in',
  'mr-in',
  'pa-in',
  'ta-in',
  'te-in',
  'nb-no',
  'nn-no',
  'cy-gb',
  'ca-es',
]

export function getLocaleRegionLabel(locale: string, accountLocale: string) {
  const intlLocale = new Intl.Locale(locale)
  if (!intlLocale.region) {
    throw new Error(`Locale ${locale} does not have a region`)
  }
  const regionLabel = new Intl.DisplayNames(accountLocale, { type: 'region' }).of(intlLocale.region)
  if (!regionLabel) {
    return locale
  }
  if (LABEL_NEEDS_LANGUAGE.includes(locale)) {
    const languageLabel = new Intl.DisplayNames(accountLocale, { type: 'language' }).of(intlLocale.language)
    if (languageLabel) {
      return `${regionLabel} (${languageLabel})`
    }
  }
  return regionLabel
}

function isSupportedLocale(locale: string) {
  return LOCALE_SUPPORTED_LIST.includes(locale.toLowerCase())
}

function getNavigatorLanguages() {
  return typeof navigator !== 'undefined' && typeof navigator.languages !== 'undefined'
    ? navigator.languages.map((locale) => locale.toLowerCase())
    : []
}

export function useAccountLocale() {
  const [locale, setLocale] = useState<string>(getIntlLocale(localeCode).toLowerCase())
  useEffect(() => subscribeToLocaleChange(({ localeCode }) => setLocale(getIntlLocale(localeCode).toLowerCase())), [])
  return locale
}

export function useLocaleAuto() {
  const accountLocale = useAccountLocale()
  const localeAuto = useMemo(() => {
    if (isSupportedLocale(accountLocale)) {
      return accountLocale
    }

    return getNavigatorLanguages().find((locale) => isSupportedLocale(locale)) ?? LOCALE_FALLBACK
  }, [accountLocale])

  return localeAuto
}
