export type WordCountInfo = {
  wordCount: number
  characterCount: number
  nonWhitespaceCharacterCount: number
}

export type WordCountInfoCollection = {
  document?: WordCountInfo
  selection?: WordCountInfo
}

export type CodePointRange = [number, number]
