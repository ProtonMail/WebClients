import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact'
import { BasePropertiesState } from './BasePropertiesState'

export type UserEvent = { name: string; payload: unknown }

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
export class SyncedEditorState extends BasePropertiesState<SyncedEditorStateValues, UserEvent> {
  constructor() {
    super(DefaultValues)
  }
}
