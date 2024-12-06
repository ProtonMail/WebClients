import { BasePropertiesState } from '@proton/docs-shared'
import type { RecentDocumentServiceState } from './types'
import type { RecentDocumentItem } from './RecentDocumentItem'

type RecentDocumentStateValues = {
  state: RecentDocumentServiceState
  recents: RecentDocumentItem[]
}
export const DefaultValues: RecentDocumentStateValues = {
  state: 'not_fetched',
  recents: [],
}

type RecentDocumentEvent = {
  name: string
  payload: undefined
}

export class RecentDocumentState extends BasePropertiesState<RecentDocumentStateValues, RecentDocumentEvent> {}
