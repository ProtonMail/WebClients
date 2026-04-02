import { createContext, useContext, useState } from 'react'
import { EditorSystemMode } from '@proton/docs-shared'
import type { StoreApi } from 'zustand'
import { createStore } from 'zustand'
import { EditorUserMode } from '../Lib/EditorUserMode'

type EditorState = {
  userMode: EditorUserMode
  setUserMode: (userMode: EditorUserMode) => void
  editorHidden: boolean
  setEditorHidden: (editorHidden: boolean) => void
  editingLocked: boolean
  setEditingLocked: (editingLocked: boolean) => void
  isMigrating: boolean
  setIsMigrating: (isMigrating: boolean) => void
}

const EditorStateContext = createContext<StoreApi<EditorState> | null>(null)

export function useEditorState() {
  const state = useContext(EditorStateContext)
  if (!state) {
    throw new Error('EditorState instance not found')
  }
  return state
}

export function EditorStateProvider({
  children,
  systemMode,
}: {
  children: React.ReactNode
  systemMode: EditorSystemMode
}) {
  const [editorState] = useState(() =>
    createStore<EditorState>((set, get) => ({
      userMode: systemMode === EditorSystemMode.Edit ? EditorUserMode.Edit : EditorUserMode.Preview,
      setUserMode: (userMode: EditorUserMode) => set({ userMode }),
      editorHidden: true,
      setEditorHidden: (editorHidden: boolean) => set({ editorHidden }),
      editingLocked: true,
      setEditingLocked: (editingLocked: boolean) => set({ editingLocked: get().isMigrating ? true : editingLocked }),
      isMigrating: false,
      setIsMigrating: (isMigrating: boolean) =>
        set((prev) => ({
          isMigrating,
          editingLocked: isMigrating ? true : prev.editingLocked,
        })),
    })),
  )
  return <EditorStateContext.Provider value={editorState}>{children}</EditorStateContext.Provider>
}
