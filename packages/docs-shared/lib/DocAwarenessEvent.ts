import { UserState } from '@lexical/yjs'

export enum DocAwarenessEvent {
  AwarenessStateChange = 'AwarenessStateChange',
}

export type DocsAwarenessStateChangeData = {
  states: UserState[]
}
