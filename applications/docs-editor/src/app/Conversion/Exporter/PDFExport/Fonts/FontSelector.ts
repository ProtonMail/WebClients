import { maxBy } from '../LexicalNodeToPDFNode/Utils/maxBy'
import { AllLanguageRanges, SupportedLanguageRanges } from './Ranges'

const DefaultFont = 'Helvetica'
const DefaultCodeFont = 'Courier'

export function getFontForText(text: string, options: { isCode: boolean; isBold: boolean; isItalic: boolean }): string {
  const { isCode, isBold, isItalic } = options

  let defaultFont = isCode ? DefaultCodeFont : DefaultFont
  if (isBold || isItalic) {
    defaultFont += '-'
    if (isBold) {
      defaultFont += 'Bold'
    }
    if (isItalic) {
      defaultFont += 'Oblique'
    }
  }

  const result = maxBy(Object.entries(AllLanguageRanges), ([_, test]) => text.match(test)?.length ?? 0)
  if (!result) {
    return defaultFont
  }

  const script = result[0]
  if (!script) {
    return defaultFont
  }

  if (!SupportedLanguageRanges.includes(script)) {
    return defaultFont
  }

  const fontFamily = ['Latin', 'Cyrillic', 'Greek'].includes(script) ? defaultFont : `Noto Sans ${script}`
  return fontFamily
}
