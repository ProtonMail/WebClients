import type { SafeDocsUserState } from './Doc/DocsAwareness'

export enum DocAwarenessEvent {
  AwarenessStateChange = 'AwarenessStateChange',
}

export type DocsAwarenessStateChangeData = {
  states: SafeDocsUserState[]
}
