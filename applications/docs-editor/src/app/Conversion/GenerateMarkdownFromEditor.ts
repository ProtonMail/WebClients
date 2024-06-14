import { LexicalEditor } from 'lexical'
import { MarkdownTransformers } from '../Tools/MarkdownTransformers'
import { $convertToMarkdownString } from '../Utils/MarkdownExport'

export function generateMarkdownFromEditor(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => {
    return $convertToMarkdownString(MarkdownTransformers)
  })
}
