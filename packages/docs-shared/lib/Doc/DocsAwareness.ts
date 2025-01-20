import { Awareness } from 'y-protocols/awareness'
import type { UserState } from '@lexical/yjs'

export type DocsUserState = UserState & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  awarenessData: Record<string, any> & {
    anonymousUserLetter?: string
    userId: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export class DocsAwareness extends Awareness {
  getLocalState(): DocsUserState | null {
    return super.getLocalState() as DocsUserState
  }

  getStates(): Map<number, DocsUserState> {
    return super.getStates() as Map<number, DocsUserState>
  }

  /**
   * When a single client refreshes their page, they may not have the chance to propagate their own removal
   * This means that when the user comes back to the page after the refresh, they will see their old user avatar.
   * (Other users will also see the old avatar). This function looks for duplicates based on the username (email)
   * for normal clients and a random ID for anonymous users and if there are more than one state entries for an
   * email, it will delete any not equal to our current client id.
   *
   * There needs to be a mechanism to re-register presence when the user comes back to the page as once they are removed
   * from the state here, that client will no longer properly broadcast cursor changes.
   */
  removeDuplicateClients(): void {
    const states = this.getStates()

    // Map userId to array of clientIds
    const userClients: Map<string, number[]> = new Map()

    // Populate the map
    for (const [clientId, userState] of states) {
      const userId = userState.awarenessData?.userId ?? userState.name
      const existing = userClients.get(userId) ?? []
      existing.push(clientId)
      userClients.set(userId, existing)
    }

    // Handle where for a user id there are multiple clients
    for (const [_userId, clientIds] of userClients) {
      if (clientIds.length > 1) {
        for (const clientID of clientIds) {
          if (clientID !== this.doc.clientID) {
            this.states.delete(clientID)
          }
        }
      }
    }
  }

  getClientIds(): number[] {
    return Array.from(this.getStates().keys())
  }
}
