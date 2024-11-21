import * as ReactTestUtils from '../../Utils/react-test-utils'
import { createEditorClient, EditorClient } from '../TestUtils/EditorClient'
import { RtsMessagePayload } from 'packages/docs-shared/lib/Doc/RtsMessagePayload'

function corruptBytes(bytes: Uint8Array, corruptionRate = 0.1): Uint8Array {
  const corrupted = new Uint8Array(bytes)
  for (let i = 0; i < corrupted.length; i++) {
    if (Math.random() < corruptionRate) {
      corrupted[i] = Math.floor(Math.random() * 256)
    }
  }
  return corrupted
}

async function getExampleEdits() {
  const tempClient = await createEditorClient()
  await tempClient.bootstrapWithEmptyParagraph()

  await tempClient.insertText('Hello')
  await tempClient.insertText('World')
  await tempClient.insertText('!')

  expect(tempClient.propagatedMessages.length).toBe(3)

  const exampleEdits = tempClient.propagatedMessages.slice()
  const exampleState = tempClient.getStateAsJson()

  await tempClient.cleanup()

  return { exampleEdits, exampleState }
}

async function getEditorStateWhenApplyingEdits(edits: RtsMessagePayload[]) {
  const client = await createEditorClient()

  await ReactTestUtils.act(async () => {
    for (const edit of edits) {
      client.state.receiveMessage(edit)
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

      for (const edit of exampleEdits) {
        await ReactTestUtils.act(async () => {
          client1.state.receiveMessage(edit)
        })
      }

      expect(client1.getStateAsJson()).toBe(exampleState)
    })

    test('corrupting the last edit should still display the previous state', async () => {
      const { exampleEdits } = await getExampleEdits()

      const lastEdit = exampleEdits[exampleEdits.length - 1].content
      exampleEdits[exampleEdits.length - 1].content = corruptBytes(lastEdit)

      const expectedState = await getEditorStateWhenApplyingEdits(exampleEdits.slice(0, -1))

      await client1.enableSafeMode()

      await ReactTestUtils.act(async () => {
        console.error = jest.fn()
        for (const edit of exampleEdits) {
          try {
            client1.state.receiveMessage(edit)
          } catch (error) {}
        }
      })

      expect(client1.getStateAsJson()).toBe(expectedState)
    })
  })
})
