import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact'
import { BasePropertiesState } from './BasePropertiesState'
import type { SafeDocsUserState } from '../Doc/DocsAwareness'

export type SyncedEditorEvent = {
  name: 'ScrollToUserCursorData'
  payload: {
    state: SafeDocsUserState
  }
}

export interface SyncedEditorStateValues {
  contactEmails: ContactEmail[]
  userName: string
  /** Whether the suggestions feature flag is enabled and killswitch is off */
  suggestionsEnabled: boolean
}

const DefaultValues: SyncedEditorStateValues = {
  contactEmails: [],
  userName: '',
  suggestionsEnabled: true,
}

/**
 * Properties that are synced between the parent and the editor frame.
 */
export class SyncedEditorState extends BasePropertiesState<SyncedEditorStateValues, SyncedEditorEvent> {
  constructor() {
    super(DefaultValues)
  }
}
