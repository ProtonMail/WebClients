import { createHeadlessEditor } from '@lexical/headless'
import { type LexicalEditor, type SerializedEditorState, $nodesOfType } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { CommentThreadMarkNode, $unwrapCommentThreadMarkNode } from '../../Plugins/Comments/CommentThreadMarkNode'
import { sendErrorMessage } from '../../Utils/errorMessage'
import type { DocxExportContext } from '../Docx/LexicalToDocx/Context'

export type ExporterRequiredCallbacks = {
  fetchExternalImageAsBase64: DocxExportContext['fetchExternalImageAsBase64']
}

export abstract class EditorExporter {
  protected editor: LexicalEditor

  constructor(
    editorState: SerializedEditorState | string,
    protected callbacks: ExporterRequiredCallbacks,
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

    this.editor.setEditorState(this.editor.parseEditorState(editorState))

    this.removeCommentThreadMarks()
  }

  /**
   * We don't want comment thread highlights in the exported document so we remove them before exporting
   */
  private removeCommentThreadMarks() {
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

  abstract export(): Promise<Uint8Array | Blob>
}
