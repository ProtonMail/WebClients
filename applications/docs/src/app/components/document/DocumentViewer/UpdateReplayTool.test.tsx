import type { EditorControllerInterface } from '@proton/docs-core/EditorController/EditorController'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JSZip from 'jszip'
import * as Y from 'yjs'
import UpdateReplayTool from './UpdateReplayTool'

jest.mock('@proton/shared/lib/env', () => ({
  ...jest.requireActual('@proton/shared/lib/env'),
  // Keeps the tool off the local multi-tab relay, which only exists in local dev.
  isLocalEnvironment: () => false,
}))

async function createUpdatesZip(count: number): Promise<File> {
  const doc = new Y.Doc()
  const updates: Uint8Array<ArrayBuffer>[] = []
  doc.on('update', (update) => updates.push(new Uint8Array(update)))
  for (let i = 0; i < count; i++) {
    doc.getMap('kv').set('step', i)
  }
  const zip = new JSZip()
  updates.forEach((update, index) => zip.file(`${index + 1}.bin`, update))
  const bytes = new Uint8Array(await zip.generateAsync({ type: 'uint8array' }))
  const file = new File([bytes], 'all-updates.zip', { type: 'application/zip' })
  // jsdom's File has no arrayBuffer().
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.slice().buffer })
  return file
}

function createEditorController() {
  let stateVersion = 0
  return {
    applyUpdate: jest.fn(async () => {}),
    getLocalSpreadsheetStateJSON: jest.fn(async () => ({ stateVersion: stateVersion++ })),
    replaceLocalSpreadsheetState: jest.fn(async () => {}),
  }
}

async function renderToolWithUpdates(editorController: ReturnType<typeof createEditorController>, count: number) {
  render(
    <UpdateReplayTool
      onClose={() => {}}
      editorController={editorController as unknown as EditorControllerInterface}
      isSpreadsheet
    />,
  )
  return {
    async loadUpdates() {
      await userEvent.upload(screen.getByLabelText('Updates to apply:'), await createUpdatesZip(count))
      await screen.findByText(`Applied: 0 / ${count}`)
    },
  }
}

async function applyNextUpdate(applied: number, total: number) {
  await userEvent.click(screen.getByRole('button', { name: 'Apply next update' }))
  await screen.findByText(`Applied: ${applied} / ${total}`)
}

async function applyMultiple(count: number, applied: number, total: number, { merge = false } = {}) {
  fireEvent.change(screen.getByLabelText('Apply mulitple:'), { target: { value: String(count) } })
  await userEvent.click(screen.getByRole('button', { name: `${merge ? 'Merge apply' : 'Apply'} ${count} updates` }))
  await screen.findByText(`Applied: ${applied} / ${total}`)
}

afterEach(() => {
  cleanup()
})

describe('UpdateReplayTool', () => {
  it('never fetches the sheet state while applying updates with time travel off', async () => {
    const editorController = createEditorController()
    const tool = await renderToolWithUpdates(editorController, 5)
    await userEvent.click(screen.getByLabelText('Enabled'))

    await tool.loadUpdates()
    await applyNextUpdate(1, 5)
    await applyMultiple(2, 3, 5)
    await userEvent.click(screen.getByLabelText('Merge before applying'))
    await applyMultiple(2, 5, 5, { merge: true })

    expect(editorController.applyUpdate).toHaveBeenCalledTimes(4)
    expect(editorController.getLocalSpreadsheetStateJSON).not.toHaveBeenCalled()
  })

  it('keeps a snapshot of the sheet after each applied update with time travel on, and travels back to it', async () => {
    const editorController = createEditorController()
    const tool = await renderToolWithUpdates(editorController, 5)

    await tool.loadUpdates()
    await applyNextUpdate(1, 5)
    await applyMultiple(2, 3, 5)

    // One snapshot on load, then one per applied update.
    expect(editorController.getLocalSpreadsheetStateJSON).toHaveBeenCalledTimes(4)
    expect(screen.getByText('3 / 3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }))
    await waitFor(() =>
      expect(editorController.replaceLocalSpreadsheetState).toHaveBeenCalledWith({ stateVersion: 2 }, false),
    )
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('keeps one snapshot per merged batch with time travel on', async () => {
    const editorController = createEditorController()
    const tool = await renderToolWithUpdates(editorController, 5)

    await tool.loadUpdates()
    await userEvent.click(screen.getByLabelText('Merge before applying'))
    await applyMultiple(3, 3, 5, { merge: true })

    expect(editorController.applyUpdate).toHaveBeenCalledTimes(1)
    // One snapshot on load, one for the batch.
    expect(editorController.getLocalSpreadsheetStateJSON).toHaveBeenCalledTimes(2)
  })

  it('drops the snapshot being fetched when time travel is switched off before the editor answers', async () => {
    const editorController = createEditorController()
    const tool = await renderToolWithUpdates(editorController, 5)
    await tool.loadUpdates()
    let answer: (state: { stateVersion: number }) => void = () => {}
    editorController.getLocalSpreadsheetStateJSON.mockImplementationOnce(
      () => new Promise<{ stateVersion: number }>((resolve) => (answer = resolve)),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Apply next update' }))
    await waitFor(() => expect(editorController.getLocalSpreadsheetStateJSON).toHaveBeenCalledTimes(2))
    await userEvent.click(screen.getByLabelText('Enabled'))
    answer({ stateVersion: 99 })
    await screen.findByText('Applied: 1 / 5')

    // Only the snapshot from loading is kept.
    expect(screen.getByText('1 / 0')).toBeInTheDocument()
  })
})
