import { Editor, type EditorProps } from './Editor'

/**
 * Standalone Docs editor entry point.
 * Must be wrapped in a shell adapter which provides the dependencies required by the editor.
 */
export function StandaloneDocsEditor(props: EditorProps) {
  return <Editor {...props} />
}
