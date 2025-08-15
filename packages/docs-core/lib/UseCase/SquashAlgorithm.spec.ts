import * as Y from 'yjs'

describe('SquashAlgorithm', () => {
  describe('yjs merge', () => {
    const harvestUpdates = async (doc: Y.Doc, count: number): Promise<Uint8Array<ArrayBuffer>[]> => {
      return new Promise((resolve) => {
        const updates: Uint8Array<ArrayBuffer>[] = []

        doc.on('update', (update) => {
          updates.push(update)

          if (updates.length === count) {
            resolve(updates)
          }
        })
      })
    }

    it('should be able to merge a single update', async () => {
      const doc = new Y.Doc()

      const updatesPromise = harvestUpdates(doc, 1)

      doc.getText().insert(0, 'H')

      const updates = await updatesPromise

      const squashed = Y.mergeUpdates(updates)

      const reassembledDoc = new Y.Doc()
      Y.applyUpdate(reassembledDoc, squashed)

      expect(reassembledDoc.getText().toString()).toEqual('H')
    })

    it('should be able to merge multiple updates', async () => {
      const doc = new Y.Doc()

      const updatesPromise = harvestUpdates(doc, 3)

      doc.getText().insert(0, 'H')
      doc.getText().insert(1, 'e')
      doc.getText().insert(2, 'y')

      const updates = await updatesPromise

      const squashed = Y.mergeUpdates(updates)

      const reassembledDoc = new Y.Doc()
      Y.applyUpdate(reassembledDoc, squashed)

      expect(reassembledDoc.getText().toString()).toEqual('Hey')
    })

    it('should be able to merge only a tail subset of updates', async () => {
      const doc = new Y.Doc()

      const updatesPromise = harvestUpdates(doc, 5)

      doc.getText().insert(0, 'H')
      doc.getText().insert(1, 'e')
      doc.getText().insert(2, 'l')
      doc.getText().insert(3, 'l')
      doc.getText().insert(4, 'o')

      const updates = await updatesPromise

      const squashed = Y.mergeUpdates(updates.slice(-2))

      const reassembledDoc = new Y.Doc()
      for (const update of updates.slice(0, 3)) {
        Y.applyUpdate(reassembledDoc, update)
      }
      Y.applyUpdate(reassembledDoc, squashed)

      expect(reassembledDoc.getText().toString()).toEqual('Hello')
    })

    it('should be able to merge only a tail subset of updates with originals being squashed as well', async () => {
      const doc = new Y.Doc()

      const updatesPromise = harvestUpdates(doc, 5)

      doc.getText().insert(0, 'H')
      doc.getText().insert(1, 'e')
      doc.getText().insert(2, 'l')
      doc.getText().insert(3, 'l')
      doc.getText().insert(4, 'o')

      const updates = await updatesPromise

      const squashed = Y.mergeUpdates(updates.slice(-2))

      const reassembledDoc = new Y.Doc()

      Y.applyUpdate(reassembledDoc, Y.mergeUpdates(updates.slice(0, 3)))
      Y.applyUpdate(reassembledDoc, squashed)

      expect(reassembledDoc.getText().toString()).toEqual('Hello')
    })
  })
})
