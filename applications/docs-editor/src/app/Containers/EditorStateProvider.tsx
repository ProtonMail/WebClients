import { createContext, useContext } from 'react'
import type { EditorState } from '../Lib/EditorState'

const EditorStateContext = createContext<{
  editorState: EditorState
} | null>(null)

export function useEditorState() {
  const value = useContext(EditorStateContext)
  if (!value) {
    throw new Error('EditorState instance not found')
  }
  return value
}

export function EditorStateProvider({
  children,
  editorState,
}: {
  children: React.ReactNode
  editorState: EditorState
}) {
  return <EditorStateContext.Provider value={{ editorState }}>{children}</EditorStateContext.Provider>
}
