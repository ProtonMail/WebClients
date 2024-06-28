import { InternalEventBusInterface } from '@proton/docs-shared'
import { UserState } from '@lexical/yjs'

const MAX_USER_STATES_FOR_LOCKING_EDITOR = 10

export enum ParticipantTrackerEvent {
  DocumentLimitBreached = 'DocumentLimitBreached',
  DocumentLimitUnbreached = 'DocumentLimitUnbreached',
}

export class DocParticipantTracker {
  private totalParticipants = 0
  private isLimitReached = false

  constructor(readonly eventBus: InternalEventBusInterface) {}

  isParticipantLimitReached() {
    return this.isLimitReached
  }

  updateParticipantsFromUserStates(states: UserState[]) {
    this.totalParticipants = states.length

    const previousValue = this.isLimitReached

    this.isLimitReached = this.totalParticipants >= MAX_USER_STATES_FOR_LOCKING_EDITOR

    if (this.isLimitReached !== previousValue) {
      this.eventBus.publish({
        type: this.isLimitReached
          ? ParticipantTrackerEvent.DocumentLimitBreached
          : ParticipantTrackerEvent.DocumentLimitUnbreached,
        payload: undefined,
      })
    }
  }
}
