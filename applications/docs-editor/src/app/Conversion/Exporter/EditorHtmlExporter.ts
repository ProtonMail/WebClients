import { $generateHtmlFromNodes } from '@lexical/html'
import { utf8StringToUint8Array } from '@proton/crypto/lib/utils'
import { EditorExporter } from './EditorExporter'

export class EditorHtmlExporter extends EditorExporter {
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const html = this.editor.getEditorState().read(() => {
      return $generateHtmlFromNodes(this.editor)
    })

    return utf8StringToUint8Array(html)
  }
}
