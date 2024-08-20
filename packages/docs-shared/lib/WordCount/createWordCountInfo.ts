import { isCJK, isKana, isThai, isWordDelimiter, toCodePoint } from './CharacterUtils'
import type { WordCountInfo } from './WordCountTypes'

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })

export const createWordCountInfo = (textContent: string): WordCountInfo => {
  let characterCount = 0
  let wordCount = 0
  let nonWhitespaceCharacterCount = 0
  let alreadyMatched = false
  for (const segmentData of segmenter.segment(textContent)) {
    const char = segmentData.segment
    const charCodePoint = toCodePoint(char)

    if (char.trim() === char) {
      nonWhitespaceCharacterCount++
    }

    characterCount++

    if (!charCodePoint) {
      break
    }

    const isMatched = !isWordDelimiter(charCodePoint)
    const shouldIncrement = !alreadyMatched || isCJK(charCodePoint) || isKana(charCodePoint) || isThai(charCodePoint)

    if (shouldIncrement && isMatched) {
      wordCount++
      alreadyMatched = true
    } else if (!isMatched) {
      alreadyMatched = false
    }
  }

  return {
    characterCount,
    nonWhitespaceCharacterCount,
    wordCount,
  }
}
