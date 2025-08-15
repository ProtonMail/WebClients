import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { EditorExporter } from './EditorExporter'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '../../Tools/MarkdownTransformers'

export class EditorMarkdownExporter extends EditorExporter {
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const markdown = this.editor.getEditorState().read(() => {
      return $convertToMarkdownString(MarkdownTransformers)
    })
    return stringToUtf8Array(markdown)
  }
}
