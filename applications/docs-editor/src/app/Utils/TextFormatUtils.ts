import {
  IS_BOLD,
  IS_ITALIC,
  IS_STRIKETHROUGH,
  IS_UNDERLINE,
  IS_CODE,
  IS_SUBSCRIPT,
  IS_SUPERSCRIPT,
  IS_HIGHLIGHT,
} from 'lexical'

const hasTextFormat = (compare: number, flag: number) => (flag & compare) !== 0

export const getFormatsForFlag = (flag: number) => {
  const formats: string[] = []
  const hasNoFormat = flag === 0
  if (hasNoFormat) {
    formats.push('No format')
    return formats
  }
  if (hasTextFormat(IS_BOLD, flag)) {
    formats.push('Bold')
  }
  if (hasTextFormat(IS_ITALIC, flag)) {
    formats.push('Italic')
  }
  if (hasTextFormat(IS_STRIKETHROUGH, flag)) {
    formats.push('Strikethrough')
  }
  if (hasTextFormat(IS_UNDERLINE, flag)) {
    formats.push('Underline')
  }
  if (hasTextFormat(IS_CODE, flag)) {
    formats.push('Code')
  }
  if (hasTextFormat(IS_SUBSCRIPT, flag)) {
    formats.push('Subscript')
  }
  if (hasTextFormat(IS_SUPERSCRIPT, flag)) {
    formats.push('Superscript')
  }
  if (hasTextFormat(IS_HIGHLIGHT, flag)) {
    formats.push('Highlight')
  }
  return formats
}
