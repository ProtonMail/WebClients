import type { UserState } from '@lexical/yjs'
import type { RelativePosition } from 'yjs'

/**
 * This type is unsafe because it states that awarenessData is always defined.
 * Yet in production we do find some cases where it is undefined.
 */
export type UnsafeDocsUserState = UserState & {
  awarenessData: Record<string, any> & {
    anonymousUserLetter?: string
    userId: string
  }
}

/** Like UnsafeDocsUserState but with awarenessData able to be undefined. */
export type SafeDocsUserState = {
  awarenessData:
    | (Record<string, any> & {
        anonymousUserLetter?: string
        userId: string
      })
    | undefined
  anchorPos: null | RelativePosition
  color: string
  focusing: boolean
  focusPos: null | RelativePosition
  name: string
}
