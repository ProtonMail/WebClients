import { createHeadlessEditor } from '@lexical/headless'
import { type LexicalEditor, type SerializedEditorState, $nodesOfType } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { CommentThreadMarkNode, $unwrapCommentThreadMarkNode } from '../../Plugins/Comments/CommentThreadMarkNode'
import { sendErrorMessage } from '../../Utils/errorMessage'
import type { DocxExportContext } from './DocxExport/LexicalToDocx/Context'

export type ExporterRequiredCallbacks = {
  fetchExternalImageAsBase64: DocxExportContext['fetchExternalImageAsBase64']
}

export abstract class EditorExporter {
  protected editor: LexicalEditor

  constructor(
    protected editorState: SerializedEditorState | string,
    protected callbacks: ExporterRequiredCallbacks,
    /**
     * If custom state handling is enabled, subclasses will be responsible
     * for setting the editor state on the headless editor.
     */
    protected options = { customStateHandling: false },
  ) {
    this.editor = createHeadlessEditor({
      editable: false,
      editorState: undefined,
      namespace: 'export-editor',
      nodes: AllNodes,
      onError: (error) => {
        sendErrorMessage(error)
      },
    })

    if (!options.customStateHandling) {
      this.editor.setEditorState(this.editor.parseEditorState(editorState))
      this.removeCommentThreadMarks()
    }
  }

  /**
   * We don't want comment thread highlights in the exported document so we remove them before exporting
   */
  protected removeCommentThreadMarks() {
    this.editor.update(
      () => {
        const commentMarkNodes = $nodesOfType(CommentThreadMarkNode)
        for (const markNode of commentMarkNodes) {
          $unwrapCommentThreadMarkNode(markNode)
        }
      },
      {
        discrete: true,
      },
    )
  }

  abstract export(): Promise<Uint8Array>
}
