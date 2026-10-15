export function matchEmojiShortcode(text: string): { query: string; start: number; closed: boolean } | null {
  const match = /(?:^|[\s([{]):([a-zA-Z0-9_+\-]{1,})(:?)$/.exec(text)
  if (!match || (!match[2] && match[1].length < 2)) {
    return null
  }
  return {
    query: match[1].toLowerCase(),
    start: text.length - match[1].length - match[2].length - 1,
    closed: !!match[2],
  }
}
