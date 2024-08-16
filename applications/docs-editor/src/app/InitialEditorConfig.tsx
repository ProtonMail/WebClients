import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { AllNodes } from './AllNodes'
import DocumentEditorTheme from './Theme/Theme'

/**
 * ShouldBootstrap refers to whether Lexical should initialize
 * the editor, with a passed `initialEditorState` or by adding a
 * new paragraph, if the root is still empty after the realtime
 * has synced initially.
 */
export const ShouldBootstrap = false

export function BuildInitialEditorConfig(config: { onError: (e: Error) => void }): InitialConfigType {
  return {
    editable: false,
    editorState: null,
    namespace: 'editor',
    nodes: AllNodes,
    theme: DocumentEditorTheme,
    onError: config.onError,
  }
}
