import type { CodePointRange } from './WordCountTypes'
import * as WordDelimeters from './WordDelimiters'

export const toCodePoint = (str: string) => str.codePointAt(0)

const wordDelimiters = new Set(Object.values(WordDelimeters).map(toCodePoint))

export const isWordDelimiter = (charCode: number | undefined) => charCode && wordDelimiters.has(charCode)

export const isWhitespace = (char: string) => char.trim() !== char

export const isWithinCodePointRange = (codePoint: number, [start, end]: [number, number]) =>
  codePoint >= start && codePoint <= end

export const isKana = (codePoint: number) => {
  const kanaRanges: CodePointRange[] = [
    // Hiragana
    [0x3040, 0x309f],
    // Katakana
    [0x30a0, 0x30ff],
  ]
  return kanaRanges.some((codePointRange) => isWithinCodePointRange(codePoint, codePointRange))
}

export const isCJK = (codePoint: number) => {
  const cjkRanges: CodePointRange[] = [
    // CJK Unified Ideographs
    [0x4e00, 0x9fff],
    // CJK Unified Ideographs Extension A
    [0x3400, 0x4dbf],
    // CJK Unified Ideographs Extension B
    [0x20000, 0x2a6df],
    // CJK Unified Ideographs Extension C
    [0x2a700, 0x2b73f],
    // CJK Unified Ideographs Extension D
    [0x2b740, 0x2b81f],
    // CJK Unified Ideographs Extension E
    [0x2b820, 0x2ceaf],
    // CJK Unified Ideographs Extension F
    [0x2ceb0, 0x2ebef],
    // CJK Compatibility Ideographs
    [0xf900, 0xfaff],
    // CJK Compatibility Ideographs Supplement
    [0x2f800, 0x2fa1f],
    // CJK Symbols and Punctuation
    [0x3000, 0x303f],
    // Kana Supplement
    [0x1b000, 0x1b0ff],
    // Kana Extended-A
    [0x1b100, 0x1b12f],
  ]
  return cjkRanges.some((cjkRange) => isWithinCodePointRange(codePoint, cjkRange))
}

export const isThai = (codePoint: number) => isWithinCodePointRange(codePoint, [0x0e00, 0x0e7f])
