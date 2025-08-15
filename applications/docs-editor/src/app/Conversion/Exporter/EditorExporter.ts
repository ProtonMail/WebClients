import { createHeadlessEditor } from '@lexical/headless'
import { type LexicalEditor, type SerializedEditorState } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import type { DocxExportContext } from './DocxExport/LexicalToDocx/Context'
import { removeCommentThreadMarks } from '../../Tools/removeCommentThreadMarks'
import { rejectAllSuggestions } from '../../Plugins/Suggestions/rejectAllSuggestions'

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
        reportErrorToSentry(error)
      },
    })

    if (!options.customStateHandling) {
      this.editor.setEditorState(this.editor.parseEditorState(editorState))
      this.removeCommentThreadMarks()
      this.removeSuggestions()
    }
  }

  /**
   * We don't want comment thread highlights in the exported document so we remove them before exporting
   */
  protected removeCommentThreadMarks() {
    removeCommentThreadMarks(this.editor)
  }

  /**
   * We don't want suggestions in the exported document so we remove them before exporting
   */
  protected removeSuggestions() {
    rejectAllSuggestions(this.editor)
  }

  abstract export(): Promise<Uint8Array<ArrayBuffer>>
}
