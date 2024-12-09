import { IS_ANDROID, IS_IOS } from '@lexical/utils'
import type { CustomWindow } from '@proton/docs-core'

export function isMobile() {
  return (
    IS_ANDROID ||
    IS_IOS ||
    (window as CustomWindow).Android != null ||
    (window as CustomWindow).webkit?.messageHandlers?.iOS != null
  )
}
