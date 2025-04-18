import type { LexicalEditor } from 'lexical'
import { $getRoot, $createParagraphNode, $getSelection } from 'lexical'
import type { EditorInitializationConfig } from '@proton/docs-shared'
import { TranslatedResult } from '@proton/docs-shared'
import { DocWillInitializeWithEmptyNodeEvent } from '@proton/docs-shared'
import { $importDataIntoEditor } from '../../Conversion/ImportDataIntoEditor'
import type { Binding } from '@lexical/yjs'
import { CLEAR_HISTORY_COMMAND } from './useYjsHistory'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { c } from 'ttag'

/**
 * When a completely new document is created, the lexical editor state
 * is empty. If a new document has been created, the editor is initialized
 * by adding an empty paragraph to the root. If a conversion is performed,
 * the data is imported into the editor. We make sure to then clear the
 * history of the editor so that the user cannot undo the initial state.
 * We only do this initialization if both the lexical & yjs roots are empty,
 * and if a initialization config is provided, so that this does not run for
 * existing documents.
 */
export async function initializeEditorAccordingToConfigIfRootIsEmpty(
  editor: LexicalEditor,
  binding: Binding,
  editorInitializationConfig: EditorInitializationConfig,
): Promise<TranslatedResult<void>> {
  const yjsRoot = binding.root
  const isYjsRootEmpty = yjsRoot.isEmpty() && yjsRoot._xmlText.length === 0
  const isLexicalRootEmpty = editor.getEditorState().read(() => {
    const root = $getRoot()
    return root.isEmpty()
  })

  if (!isYjsRootEmpty || !isLexicalRootEmpty) {
    return TranslatedResult.ok()
  }

  let result: TranslatedResult<void> = TranslatedResult.ok()

  if (editorInitializationConfig.mode === 'creation') {
    binding.doc.emit(DocWillInitializeWithEmptyNodeEvent, [true, binding.doc])

    try {
      editor.update(
        () => {
          const root = $getRoot()
          if (!root.isEmpty()) {
            return
          }

          const paragraph = $createParagraphNode()
          root.append(paragraph)

          const { activeElement } = document
          const lexicalHasNoSelection = $getSelection() !== null
          const rootIsFocused = activeElement !== null && activeElement === editor.getRootElement()
          if (lexicalHasNoSelection || rootIsFocused) {
            paragraph.select()
          }
        },
        {
          discrete: true,
        },
      )
    } catch (error) {
      reportErrorToSentry(error)
      return TranslatedResult.failWithTranslatedError<void>(
        c('Error').t`Failed to initialize editor due to unknown error.`,
      )
    }
  } else if (editorInitializationConfig.mode === 'conversion' && editorInitializationConfig.type.docType === 'doc') {
    result = await $importDataIntoEditor(editor, editorInitializationConfig.data, editorInitializationConfig.type)
  }

  editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)

  return result
}
