import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact'
import { BasePropertiesState } from './BasePropertiesState'
import type { UserState } from '@lexical/yjs'

export type SyncedEditorEvent = {
  name: 'ScrollToUserCursorData'
  payload: {
    state: UserState
  }
}

export interface SyncedEditorStateValues {
  contactEmails: ContactEmail[]
  userName: string
}

const DefaultValues: SyncedEditorStateValues = {
  contactEmails: [],
  userName: '',
}

/**
 * Properties that are synced between the parent and the editor frame.
 */
export class SyncedEditorState extends BasePropertiesState<SyncedEditorStateValues, SyncedEditorEvent> {
  constructor() {
    super(DefaultValues)
  }
}
