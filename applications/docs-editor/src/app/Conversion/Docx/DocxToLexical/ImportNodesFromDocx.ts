import { parseAsync } from 'docx-preview-cjs'
import type { LexicalEditor } from 'lexical'
import { $createParagraphNode, $insertNodes } from 'lexical'

import { TranslatedResult } from '@proton/docs-shared'
import { c } from 'ttag'
import { ParseDocxElements } from './Parsing/ParseDocxElement'
import { mapDocxChildren } from './CreateLexicalNodeFromDocxInfo'

export async function $importNodesFromDocx(
  editor: LexicalEditor,
  docx: Blob | ArrayBuffer | Uint8Array<ArrayBuffer>,
): Promise<TranslatedResult<void>> {
  try {
    const parsedDocx = await parseAsync(docx, {
      useBase64URL: true,
    })

    const elements = parsedDocx.documentPart.body.children
    if (!elements) {
      return TranslatedResult.ok()
    }

    const results = await ParseDocxElements(elements, parsedDocx)

    editor.update(
      () => {
        const nodes = mapDocxChildren(results)
        $insertNodes(nodes.concat($createParagraphNode()))
      },
      {
        discrete: true,
      },
    )

    return TranslatedResult.ok()
  } catch (error) {
    console.error('Failed to import nodes from docx', error)

    return TranslatedResult.failWithTranslatedError(
      c('Error')
        .t`Unable to convert Word document. Is it password protected? If so, please remove the password and try again.`,
    )
  }
}
