import { $getRoot } from 'lexical'
import { applyUpdate, Doc } from 'yjs'
import * as ReactTestUtils from '../TestUtils/react-test-utils'
import type { EditorClient, YjsUpdate } from '../TestUtils/EditorClient'
import { createEditorClient } from '../TestUtils/EditorClient'

/**
 * Keeps only the client and struct counts of a Yjs update, so decoding fails before any struct is integrated.
 * Randomly overwriting bytes is not used because some corruptions still decode as a valid, destructive update.
 */
function corruptBytes(bytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  return bytes.slice(0, 2)
}

async function getExampleEdits() {
  const tempClient = await createEditorClient()
  await tempClient.bootstrapWithEmptyParagraph()

  await tempClient.insertText('Hello')
  await tempClient.insertText('World')
  await tempClient.insertText('!')

  expect(tempClient.propagatedUpdates.length).toBe(4)

  const exampleEdits = tempClient.propagatedUpdates.slice()
  const exampleState = tempClient.getStateAsJson()

  await tempClient.cleanup()

  return { exampleEdits, exampleState }
}

async function getEditorStateWhenApplyingEdits(edits: YjsUpdate[]) {
  const client = await createEditorClient()

  await ReactTestUtils.act(async () => {
    for (const edit of edits) {
      client.state.receiveUpdate(edit)
    }
  })

  await client.cleanup()

  return client.getStateAsJson()
}

describe('YjsReadonlyPlugin', () => {
  let client1: EditorClient

  beforeEach(async () => {
    client1 = await createEditorClient()
  })

  afterEach(async () => {
    await client1.cleanup()
  })

  describe('Safe mode', () => {
    test('ensure edits can be played back', async () => {
      const { exampleEdits, exampleState } = await getExampleEdits()

      await ReactTestUtils.act(async () => {
        for (const edit of exampleEdits) {
          client1.state.receiveUpdate(edit)
        }
      })

      // Marks the root node as dirty so that reconciliation
      // happens and the direction property is correctly set.
      await ReactTestUtils.act(async () => {
        await client1.updateEditor(() => {
          $getRoot().markDirty()
        })
      })

      expect(client1.getStateAsJson()).toBe(exampleState)
    })

    test('corrupting the last edit should still display the previous state', async () => {
      const { exampleEdits } = await getExampleEdits()

      const corruptedEdit = corruptBytes(exampleEdits[exampleEdits.length - 1])
      expect(() => applyUpdate(new Doc(), corruptedEdit)).toThrow()
      exampleEdits[exampleEdits.length - 1] = corruptedEdit

      const expectedState = await getEditorStateWhenApplyingEdits(exampleEdits.slice(0, -1))

      await client1.enableSafeMode()

      await ReactTestUtils.act(async () => {
        console.error = jest.fn()
        for (const edit of exampleEdits) {
          try {
            client1.state.receiveUpdate(edit)
          } catch (error) {}
        }
      })

      expect(client1.getStateAsJson()).toBe(expectedState)
    })
  })
})
