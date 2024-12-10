import { IS_ANDROID, IS_IOS } from '@lexical/utils'

export function isMobile() {
  return IS_ANDROID || IS_IOS
}
