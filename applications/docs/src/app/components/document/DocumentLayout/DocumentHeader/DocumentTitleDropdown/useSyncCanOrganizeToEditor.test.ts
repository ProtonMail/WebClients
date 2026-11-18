import { DocumentState, type DocumentStateValues } from '@proton/docs-core/State/DocumentState'
import { SyncedEditorState } from '@proton/docs-shared/State/SyncedEditorState'
import { act, renderHook } from '@testing-library/react'

import { useSyncCanOrganizeToEditor } from './useSyncCanOrganizeToEditor'

function setup({ editorReady }: { editorReady: boolean }) {
  const documentState = new DocumentState({ ...DocumentState.defaults, editorReady } as DocumentStateValues)
  const syncedEditorState = new SyncedEditorState()
  const sent: boolean[] = []
  syncedEditorState.subscribeToAnyProperty((property, value) => {
    if (property === 'canOrganize') {
      sent.push(value as boolean)
    }
  })
  // The subscription reports the default at once; only what the hook sends counts
  sent.length = 0
  const hook = renderHook(
    ({ canOrganize }) => useSyncCanOrganizeToEditor(documentState, syncedEditorState, canOrganize),
    { initialProps: { canOrganize: false } },
  )
  return { documentState, syncedEditorState, sent, hook }
}

describe('useSyncCanOrganizeToEditor', () => {
  test('sends canOrganize to a ready editor, and again when Drive answers', () => {
    const { syncedEditorState, sent, hook } = setup({ editorReady: true })

    hook.rerender({ canOrganize: true })

    expect(sent).toEqual([false, true])
    expect(syncedEditorState.getProperty('canOrganize')).toBe(true)
  })

  test('sends it again once the editor is ready, which misses what came before', () => {
    const { documentState, sent, hook } = setup({ editorReady: false })

    hook.rerender({ canOrganize: true })
    expect(sent).toEqual([])

    act(() => documentState.setProperty('editorReady', true))

    expect(sent).toEqual([true])
  })
})
