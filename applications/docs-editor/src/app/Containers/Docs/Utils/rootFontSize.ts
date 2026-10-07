import { getHTMLElementFontSize } from './getHTMLElementFontSize'

let rootFontSizeCache: number | undefined

export function rootFontSize(reset?: boolean): number {
  if (rootFontSizeCache === undefined || reset === true) {
    rootFontSizeCache = getHTMLElementFontSize(document.documentElement)
  }
  return rootFontSizeCache
}
