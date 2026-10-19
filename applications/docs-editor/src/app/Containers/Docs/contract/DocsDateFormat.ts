/**
 * Absolute times follow the account's date locale and time format setting, which can differ from
 * `languageCode`: `en_GB` with a 24-hour clock has the language code `en`.
 */
export type DocsDateFormat = {
  localeCode: string
  hourCycle: 'h12' | 'h23'
}
