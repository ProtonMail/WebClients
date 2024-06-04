import { LexicalEditor } from 'lexical'
import { $generateNodesFromDOM } from '@lexical/html'
import { $createParagraphNode, $getRoot, $insertNodes, LexicalNode } from 'lexical'
import { $importNodesFromDocx } from '../Utils/DocxConversion/GenerateNodesFromDocx'
import { $convertFromMarkdownString } from '../Utils/MarkdownImport'
import { MarkdownTransformers } from './MarkdownTransformers'
import { ConvertibleDataType } from '@proton/docs-shared'
import { utf8ArrayToString } from '@proton/crypto/lib/utils'
import { sendErrorMessage } from '../Utils/errorMessage'

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
  data: Uint8Array,
  dataFormat: ConvertibleDataType,
  options?: {
    html?: {
      addLineBreaks?: boolean
    }
  },
): Promise<void> {
  if (data.length === 0) {
    return
  }

  editor.update(
    () => {
      $getRoot().clear()
    },
    {
      discrete: true,
    },
  )

  if (dataFormat === 'docx') {
    editor.update(
      () => {
        void $importNodesFromDocx(editor, data)
      },
      {
        discrete: true,
      },
    )
    return
  }

  const otherFormatString = utf8ArrayToString(data)

  if (dataFormat === 'json' && isValidSuperString(editor, otherFormatString)) {
    return
  }

  let didThrow = false
  if (dataFormat === 'html') {
    const htmlOptions = options?.html || {
      addLineBreaks: false,
    }

    editor.update(
      () => {
        try {
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
        } catch (error: unknown) {
          sendErrorMessage(error)
          didThrow = true
        }
      },
      { discrete: true },
    )
  } else {
    editor.update(
      () => {
        try {
          $convertFromMarkdownString(otherFormatString, MarkdownTransformers, undefined, false)
        } catch (error: unknown) {
          sendErrorMessage(error)
          didThrow = true
        }
      },
      {
        discrete: true,
      },
    )
  }

  if (didThrow) {
    throw new Error('Could not import note. Check error console for details.')
  }
}
