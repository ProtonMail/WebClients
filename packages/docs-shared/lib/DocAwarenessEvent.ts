import type { DocsUserState } from './Doc/DocsAwareness'

export enum DocAwarenessEvent {
  AwarenessStateChange = 'AwarenessStateChange',
}

export type DocsAwarenessStateChangeData = {
  states: DocsUserState[]
}
