export const CURRENCY = 'USD'
export const LOCALE = 'en-GB'

export const AVAILABLE_FONTS = [
  { value: 'arial', label: 'Arial' },
  { value: 'calibri', label: 'Calibri' },
  { value: 'cambria', label: 'Cambria' },
  { value: 'caveat', label: 'Caveat' },
  { value: 'comfortaa', label: 'Comfortaa' },
  { value: 'comic-sans-ms', label: 'Comic Sans MS' },
  { value: 'consolas', label: 'Consolas' },
  { value: 'corsiva', label: 'Corsiva' },
  { value: 'courier-new', label: 'Courier New' },
  { value: 'droid-sans', label: 'Droid Sans' },
  { value: 'droid-serif', label: 'Droid Serif' },
  { value: 'georgia', label: 'Georgia' },
  { value: 'impact', label: 'Impact' },
  { value: 'lexend', label: 'Lexend' },
  { value: 'lobster', label: 'Lobster' },
  { value: 'lora', label: 'Lora' },
  { value: 'merriweather', label: 'Merriweather' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'nunito', label: 'Nunito' },
  { value: 'oswald', label: 'Oswald' },
  { value: 'pacifico', label: 'Pacifico' },
  { value: 'proxima-nova', label: 'Proxima Nova' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'roboto-mono', label: 'Roboto Mono' },
  { value: 'roboto-serif', label: 'Roboto Serif' },
  { value: 'source-sans-3', label: 'Source Sans 3' },
  { value: 'times-new-roman', label: 'Times New Roman' },
  { value: 'trebuchet-ms', label: 'Trebuchet MS' },
  { value: 'ubuntu', label: 'Ubuntu' },
  { value: 'verdana', label: 'Verdana' },
] as const
export type FontValue = (typeof AVAILABLE_FONTS)[number]['value']
export const FONT_LABEL_BY_VALUE = Object.fromEntries(
  AVAILABLE_FONTS.map(({ value, label }) => [value, label]),
) as Record<FontValue, string>
// TODO: make sure this is synced with SpreadsheetTheme.primaryFontFamily
export const DEFAULT_FONT = 'arial' satisfies FontValue
