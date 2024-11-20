import { isChrome, isFirefox, isSafari, isEdgeChromium } from '@proton/shared/lib/helpers/browser'

export const BROWSERS = ['chrome', 'firefox', 'safari', 'edge', 'native-ios', 'native-android', 'other'] as const

export function getBrowserForMetrics(): (typeof BROWSERS)[number] {
  if (isChrome()) {
    return 'chrome'
  }
  if (isFirefox()) {
    return 'firefox'
  }
  if (isSafari()) {
    return 'safari'
  }
  if (isEdgeChromium()) {
    return 'edge'
  }
  return 'other'
}
