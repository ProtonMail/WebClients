import { Awareness } from 'y-protocols/awareness'
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

  getStates(): Map<number, DocsUserState> {
    return super.getStates() as Map<number, DocsUserState>
  }

  /**
   * When a single client refreshes their page, they may not have the chance to propagate their own removal
   * This means that when the user comes back to the page after the refresh, they will see their old user avatar.
   * (Other users will also see the old avatar). This function looks for duplicates based on the username (email)
   * and if there are more than one state entries for an email, it will delete the one that has the older lastUpdated.
   */
  removeDuplicateClients(): void {
    const states = this.getStates()

    const alreadyBrowsedEntries: Map<string, number> = new Map()

    for (const [clientId, userState] of states) {
      const username = userState.name

      if (alreadyBrowsedEntries.has(username)) {
        const previousClientId = alreadyBrowsedEntries.get(username) as number

        const currentLastUpdated = this.meta.get(clientId)?.lastUpdated ?? 0
        const previousLastUpdated = this.meta.get(previousClientId)?.lastUpdated ?? 0

        if (currentLastUpdated > previousLastUpdated) {
          this.states.delete(previousClientId)
        } else if (currentLastUpdated < previousLastUpdated) {
          this.states.delete(clientId)
        }
      }

      alreadyBrowsedEntries.set(username, clientId)
    }
  }

  getClientIds(): number[] {
    return Array.from(this.getStates().keys())
  }
}
