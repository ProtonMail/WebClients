import type { LexicalEditor } from 'lexical'
import { $generateNodesFromDOM } from '@lexical/html'
import type { LexicalNode } from 'lexical'
import { $createParagraphNode, $getRoot, $insertNodes } from 'lexical'
import { $importNodesFromDocx } from './Docx/DocxToLexical/ImportNodesFromDocx'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '../Tools/MarkdownTransformers'
import type { ConvertibleDataType } from '@proton/docs-shared'
import { TranslatedResult } from '@proton/docs-shared'
import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { reportErrorToSentry } from '../Utils/errorMessage'
import { c } from 'ttag'

export function isValidSuperString(editor: LexicalEditor, superString: string): boolean {
  try {
    editor.parseEditorState(superString)
    return true
  } catch (error) {
    return false
  }
}

export async function $importDataIntoEditor(
  editor: LexicalEditor,
  data: Uint8Array<ArrayBuffer>,
  dataFormat: ConvertibleDataType,
  options?: {
    html?: {
      addLineBreaks?: boolean
    }
  },
): Promise<TranslatedResult<void>> {
  if (data.length === 0) {
    return TranslatedResult.ok()
  }

  if (dataFormat.docType === 'sheet' || dataFormat.dataType === 'xlsx') {
    return TranslatedResult.failWithTranslatedError(c('Error').t`Tried to import Sheet data into Lexical`)
  }

  editor.update(
    () => {
      $getRoot().clear()
    },
    {
      discrete: true,
    },
  )

  if (dataFormat.dataType === 'docx') {
    const result = await new Promise<TranslatedResult<void>>((resolve) => {
      editor.update(
        () => {
          void $importNodesFromDocx(editor, data).then(resolve)
        },
        {
          discrete: true,
        },
      )
    }).catch((error) => {
      reportErrorToSentry(error)
      return TranslatedResult.failWithTranslatedError<void>(
        c('Error').t`Failed to import Word document due to unknown error.`,
      )
    })

    return result
  }

  const otherFormatString = utf8ArrayToString(data)

  if (dataFormat.dataType === 'json' && isValidSuperString(editor, otherFormatString)) {
    return TranslatedResult.ok()
  }

  if (dataFormat.dataType === 'html') {
    const htmlOptions = options?.html || {
      addLineBreaks: false,
    }

    try {
      editor.update(
        () => {
          const parser = new DOMParser()
          const dom = parser.parseFromString(otherFormatString, 'text/html')
          const generatedNodes = $generateNodesFromDOM(editor, dom)
          const nodesToInsert: LexicalNode[] = []
          generatedNodes.forEach((node) => {
            const type = node.getType()

            // Wrap text & link nodes with paragraph since they can't
            // be top-level nodes in Super
            if (type === 'text' || type === 'link' || type === 'linebreak') {
              const paragraphNode = $createParagraphNode()
              paragraphNode.append(node)
              nodesToInsert.push(paragraphNode)
              return
            } else {
              nodesToInsert.push(node)
            }

            if (htmlOptions.addLineBreaks) {
              nodesToInsert.push($createParagraphNode())
            }
          })

          $getRoot().selectEnd()
          $insertNodes(nodesToInsert.concat($createParagraphNode()))
        },
        { discrete: true },
      )
    } catch (error) {
      reportErrorToSentry(error)
      return TranslatedResult.failWithTranslatedError<void>(c('Error').t`Failed to import HTML due to unknown error.`)
    }

    return TranslatedResult.ok()
  } else {
    try {
      editor.update(
        () => {
          $convertFromMarkdownString(otherFormatString, MarkdownTransformers, undefined, true)
        },
        {
          discrete: true,
        },
      )
    } catch (error) {
      reportErrorToSentry(error)
      return TranslatedResult.failWithTranslatedError<void>(
        c('Error').t`Failed to import Markdown due to unknown error.`,
      )
    }

    return TranslatedResult.ok()
  }
}
