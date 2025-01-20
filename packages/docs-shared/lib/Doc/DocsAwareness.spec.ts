import { DocsAwareness } from './DocsAwareness'
import * as Y from 'yjs'

describe('DocsAwareness', () => {
  let awareness: DocsAwareness

  beforeEach(() => {
    awareness = new DocsAwareness(new Y.Doc())
  })

  afterEach(() => {
    awareness.destroy()
  })

  describe('removeDuplicateClients', () => {
    it('should remove duplicate clients and keep our own client', () => {
      const newStates = new Map()
      const ourClientId = awareness.doc.clientID

      // Our client
      newStates.set(ourClientId, {
        name: 'user1',
        awarenessData: {
          userId: 'user1',
        },
      })

      // Other client for same user (should be removed)
      newStates.set(2, {
        name: 'user1',
        awarenessData: {
          userId: 'user1',
        },
      })

      // Different user (should be unaffected)
      newStates.set(3, {
        name: 'user2',
        awarenessData: {
          userId: 'user2',
        },
      })

      awareness.states = newStates

      expect(awareness.getStates().size).toBe(3)

      awareness.removeDuplicateClients()

      // Should keep: our client and different user
      expect(awareness.getStates().size).toBe(2)
      expect(awareness.getStates().get(ourClientId)).toBeDefined()
      expect(awareness.getStates().get(2)).toBeUndefined() // Other client removed
      expect(awareness.getStates().get(3)).toBeDefined() // Different user kept
    })

    it('should handle case where user ID comes from name field', () => {
      const newStates = new Map()
      const ourClientId = awareness.doc.clientID

      // Our client
      newStates.set(ourClientId, {
        name: 'user1',
        awarenessData: {},
      })

      // Other client same user
      newStates.set(2, {
        name: 'user1',
        awarenessData: {},
      })

      awareness.states = newStates

      expect(awareness.getStates().size).toBe(2)

      awareness.removeDuplicateClients()

      expect(awareness.getStates().size).toBe(1)
      expect(awareness.getStates().get(ourClientId)).toBeDefined()
      expect(awareness.getStates().get(2)).toBeUndefined()
    })
  })
})
