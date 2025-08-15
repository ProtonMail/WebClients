import { $getRoot } from 'lexical'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { EditorExporter } from './EditorExporter'

export class EditorTxtExporter extends EditorExporter {
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const plaintext = this.editor.getEditorState().read(() => {
      const root = $getRoot()
      return root.getTextContent()
    })

    return stringToUtf8Array(plaintext)
  }
}
