import { Awareness, outdatedTimeout, removeAwarenessStates } from 'y-protocols/awareness'
import { UserState } from '@lexical/yjs'

export type DocsUserState = UserState & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awarenessData: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export class DocsAwareness extends Awareness {
  getLocalState(): DocsUserState | null {
    return super.getLocalState() as DocsUserState
  }

  renewLocalClock(): void {
    const now = Date.now()
    if (!this.getLocalState()) {
      return
    }
    const state = this.meta.get(this.clientID)
    if (!state) {
      return
    }
    if (outdatedTimeout / 2 <= now - state.lastUpdated) {
      this.setLocalState(this.getLocalState())
    }
  }

  refreshPresenceState(outdatedThreshold: number = outdatedTimeout): void {
    this.renewLocalClock()
    const now = Date.now()
    const statesToRemove: number[] = []
    this.meta.forEach((meta, clientID) => {
      const isNotThisClient = clientID !== this.clientID
      const isOutdated = outdatedThreshold <= now - meta.lastUpdated
      if (isNotThisClient && isOutdated && this.states.has(clientID)) {
        statesToRemove.push(clientID)
      }
    })
    if (statesToRemove.length > 0) {
      removeAwarenessStates(this, statesToRemove, 'timeout')
    }
  }

  getStates(): Map<number, DocsUserState> {
    return super.getStates() as Map<number, DocsUserState>
  }

  getClientIds(): number[] {
    return Array.from(this.getStates().keys())
  }
}
