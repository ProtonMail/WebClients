import { Font } from '@react-pdf/renderer'

/**
 * When rendering Chinese characters (via Noto Sans SC), wrapping is not correctly performed.
 * The below fixes the issue, and was provided via https://github.com/diegomura/react-pdf/issues/692#issuecomment-626580841
 */
export function PerformChineseWrappingFix() {
  Font.registerHyphenationCallback((word: string) => {
    if (word.length === 1) {
      return [word]
    }

    return Array.from(word)
      .map((char) => [char, ''])
      .reduce((arr, current) => {
        arr.push(...current)
        return arr
      }, [])
  })
}
