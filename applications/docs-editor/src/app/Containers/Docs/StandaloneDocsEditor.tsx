import { Editor, type EditorProps } from './Editor'
import { DocsPresentationProvider } from './DocsPresentationProvider'

/**
 * Standalone Docs editor entry point.
 * Must be wrapped in a shell adapter which provides the dependencies required by the editor.
 */
export function StandaloneDocsEditor(props: EditorProps) {
  return (
    <DocsPresentationProvider userMode={props.userMode}>
      <Editor {...props} />
    </DocsPresentationProvider>
  )
}
