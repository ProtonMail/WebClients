import {
  isCJK,
  isKana,
  isThai,
  isWhitespace,
  isWordCountSupported,
  isWordDelimiter,
  toCodePoint,
} from './CharacterUtils'
import type { WordCountInfo } from './WordCountTypes'

const segmenter = isWordCountSupported ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : undefined

export const createWordCountInfo = (textContent: string): WordCountInfo => {
  let characterCount = 0
  let wordCount = 0
  let nonWhitespaceCharacterCount = 0

  if (!segmenter) {
    return { characterCount, wordCount, nonWhitespaceCharacterCount }
  }

  let alreadyMatched = false
  for (const segmentData of segmenter.segment(textContent)) {
    const char = segmentData.segment
    const charCodePoint = toCodePoint(char)

    const charIsWhitespace = isWhitespace(char)

    if (!charIsWhitespace) {
      nonWhitespaceCharacterCount++
    }

    characterCount++

    if (!charCodePoint) {
      break
    }

    const isMatched = !charIsWhitespace && !isWordDelimiter(charCodePoint)
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
