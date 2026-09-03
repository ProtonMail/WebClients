import type { LexicalEditor, LexicalNode } from 'lexical'
import { $generateNodesFromDOM } from '@lexical/html'
import { $createParagraphNode, $getRoot, $insertNodes } from 'lexical'
import { $importNodesFromDocx } from './Docx/DocxToLexical/ImportNodesFromDocx'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '../Tools/MarkdownTransformers'
import type { ConvertibleDataType } from '@proton/docs-shared'
import { TranslatedResult } from '@proton/docs-shared'
import { uint8ArrayToUtf8String } from '@protontech/crypto/utils'
import { reportErrorToSentry } from '../Utils/errorMessage'
import { c } from 'ttag'
import { odtToHtml } from 'odf-kit/odt/to-html'

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

  if (dataFormat.docType === 'sheet' || ['xlsx', 'csv', 'tsv'].includes(dataFormat.dataType)) {
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

  if (dataFormat.dataType === 'odt') {
    try {
      return importHtmlIntoEditor(editor, odtToHtml(data, { fragment: true }), options?.html, normalizeOdtImages)
    } catch (error) {
      reportErrorToSentry(error)
      return TranslatedResult.failWithTranslatedError<void>(
        c('Error').t`Failed to import OpenDocument file due to unknown error.`,
      )
    }
  }

  const otherFormatString = uint8ArrayToUtf8String(data)

  if (dataFormat.dataType === 'json' && isValidSuperString(editor, otherFormatString)) {
    return TranslatedResult.ok()
  }

  if (dataFormat.dataType === 'html') {
    try {
      return importHtmlIntoEditor(editor, otherFormatString, options?.html)
    } catch (error) {
      reportErrorToSentry(error)
      return TranslatedResult.failWithTranslatedError<void>(c('Error').t`Failed to import HTML due to unknown error.`)
    }
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

function importHtmlIntoEditor(
  editor: LexicalEditor,
  html: string,
  options?: { addLineBreaks?: boolean },
  normalizeDom?: (dom: Document) => void,
): TranslatedResult<void> {
  const htmlOptions = options || {
    addLineBreaks: false,
  }

  editor.update(
    () => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(html, 'text/html')
      normalizeDom?.(dom)
      const generatedNodes = $generateNodesFromDOM(editor, dom)
      const nodesToInsert: LexicalNode[] = []
      generatedNodes.forEach((node) => {
        const type = node.getType()

        // Wrap text & link nodes with paragraph since they can't be top-level nodes in Super
        if (type === 'text' || type === 'link' || type === 'linebreak') {
          const paragraphNode = $createParagraphNode()
          paragraphNode.append(node)
          nodesToInsert.push(paragraphNode)
          return
        }

        nodesToInsert.push(node)

        if (htmlOptions.addLineBreaks) {
          nodesToInsert.push($createParagraphNode())
        }
      })

      $getRoot().selectEnd()
      $insertNodes(nodesToInsert.concat($createParagraphNode()))
    },
    { discrete: true },
  )

  return TranslatedResult.ok()
}

function normalizeOdtImages(dom: Document): void {
  for (const image of dom.images) {
    const width = cssLengthToPixels(image.style.width)
    const height = cssLengthToPixels(image.style.height)
    if (width) {
      image.width = width
    }
    if (height) {
      image.height = height
    }
  }
}

function cssLengthToPixels(value: string): number | undefined {
  const match = value.trim().match(/^([\d.]+)(px|cm|mm|in|pt|pc)$/)
  if (!match) {
    return undefined
  }

  const amount = Number(match[1])
  const unit = match[2]
  const pixelsPerUnit: Record<string, number> = {
    px: 1,
    cm: 96 / 2.54,
    mm: 96 / 25.4,
    in: 96,
    pt: 96 / 72,
    pc: 16,
  }

  return Math.round(amount * pixelsPerUnit[unit])
}
