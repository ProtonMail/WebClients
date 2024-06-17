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
    it('should delete the client with the older lastUpdated value', () => {
      const newStates = new Map()

      newStates.set(1, { name: 'user1', awarenessData: {} })
      awareness.meta.set(1, { lastUpdated: 1, clock: 0 })

      newStates.set(2, { name: 'user2', awarenessData: {} })
      awareness.meta.set(2, { lastUpdated: 2, clock: 0 })

      newStates.set(3, { name: 'user1', awarenessData: {} })
      awareness.meta.set(3, { lastUpdated: 3, clock: 0 })

      awareness.states = newStates

      expect(awareness.getStates().size).toBe(3)

      awareness.removeDuplicateClients()

      expect(awareness.getStates().size).toBe(2)
      expect(awareness.getStates().get(1)).toBeUndefined()
    })
  })
})
