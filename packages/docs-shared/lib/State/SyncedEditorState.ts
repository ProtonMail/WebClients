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
  receivedEverythingFromRTS: boolean
  /**
   * Whether the user may move, rename and trash the document: editors and admins of their own document or one in a
   * folder shared with them, never one shared with them directly. The client asks Drive, so it is false until Drive answers.
   */
  canOrganize: boolean
}

const DefaultValues: SyncedEditorStateValues = {
  contactEmails: [],
  userName: '',
  suggestionsEnabled: true,
  receivedEverythingFromRTS: false,
  canOrganize: false,
}

/**
 * Properties that are synced between the parent and the editor frame.
 */
export class SyncedEditorState extends BasePropertiesState<SyncedEditorStateValues, SyncedEditorEvent> {
  constructor() {
    super(DefaultValues)
  }
}
