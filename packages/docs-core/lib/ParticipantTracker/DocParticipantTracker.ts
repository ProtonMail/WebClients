import type { SafeDocsUserState } from '@proton/docs-shared'
import type { DocumentState, PublicDocumentState } from '../State/DocumentState'

const MAX_USER_STATES_FOR_LOCKING_EDITOR = 10

export class DocParticipantTracker {
  private totalParticipants = 0

  constructor(readonly sharedState: DocumentState | PublicDocumentState) {}

  updateParticipantsFromUserStates(states: SafeDocsUserState[]) {
    this.totalParticipants = states.length

    const previousValue = this.sharedState.getProperty('realtimeIsParticipantLimitReached')

    const newValue = this.totalParticipants >= MAX_USER_STATES_FOR_LOCKING_EDITOR

    if (newValue === previousValue) {
      return
    }

    this.sharedState.setProperty('realtimeIsParticipantLimitReached', newValue)
  }
}
