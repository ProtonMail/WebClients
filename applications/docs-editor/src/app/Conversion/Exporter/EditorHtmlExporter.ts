import { $generateHtmlFromNodes } from '@lexical/html'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { EditorExporter } from './EditorExporter'

export class EditorHtmlExporter extends EditorExporter {
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const html = this.editor.getEditorState().read(() => {
      return $generateHtmlFromNodes(this.editor)
    })

    return stringToUtf8Array(html)
  }
}
