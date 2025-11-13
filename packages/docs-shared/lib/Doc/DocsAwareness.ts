import type { UserState } from '@lexical/yjs'
import { Awareness } from 'y-protocols/awareness'
import type { RelativePosition } from 'yjs'

/**
 * This type is unsafe because it states that awarenessData is always defined.
 * Yet in production we do find some cases where it is undefined.
 */
export type UnsafeDocsUserState = UserState & {
  awarenessData: Record<string, any> & {
    anonymousUserLetter?: string
    userId: string
  }
}

/** Like UnsafeDocsUserState but with awarenessData able to be undefined. */
export type SafeDocsUserState = {
  awarenessData:
    | (Record<string, any> & {
        anonymousUserLetter?: string
        userId: string
      })
    | undefined
  anchorPos: null | RelativePosition
  color: string
  focusing: boolean
  focusPos: null | RelativePosition
  name: string
  /** rowsandcolumns uses title instead of name, whole type should ideally be refactored to reflect the different shapes of the awareness objects that lexical has vs rowsncolumns */
  title?: string
}

export type SheetsUserState = {
  activeCell: {
    rowIndex: number
    columnIndex: number
  }
  name: string
  sheetId: number
  userId: string
  title: string
}

export class DocsAwareness<T extends UnsafeDocsUserState | SafeDocsUserState = SafeDocsUserState> extends Awareness {
  getLocalState(): T | null {
    return super.getLocalState() as T
  }

  getStates(): Map<number, T> {
    return super.getStates() as Map<number, T>
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
      const userId = userState.awarenessData?.userId ?? userState.name ?? userState.title
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
