import { Document, Packer, SectionType } from 'docx'
import { EditorExporter } from '../EditorExporter'
import type { EditorState } from 'lexical'
import { $getRoot, $isElementNode } from 'lexical'
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $isPageBreakNode } from '../../../Plugins/PageBreak/PageBreakNode'
import type { DocxExportContext } from './LexicalToDocx/Context'
import type { TopLevelChildren } from './LexicalToDocx/getTopLevelChildrenFromElementNode'
import { getTopLevelChildrenFromElementNode } from './LexicalToDocx/getTopLevelChildrenFromElementNode'
import { createHorizontalRuleChild } from './LexicalToDocx/createHorizontalRuleChild'
import { createPageBreakChild } from './LexicalToDocx/createPageBreakChild'
import { NumberingLevelsConfig } from './NumberingLevelsConfig'

export class EditorDocxExporter extends EditorExporter {
  async export(): Promise<Uint8Array<ArrayBuffer>> {
    const state = this.editor.getEditorState()
    const docx = await this.generateDocxFromEditorState(state)
    const buffer = await Packer.toBlob(docx)

    return new Uint8Array(await buffer.arrayBuffer())
  }

  private async generateDocxFromEditorState(state: EditorState): Promise<Document> {
    const context: DocxExportContext = {
      state,
      fetchExternalImageAsBase64: this.callbacks.fetchExternalImageAsBase64,
    }

    const topLevelChildren: TopLevelChildren[] = []

    const children = state.read(() => {
      const root = $getRoot()
      return root.getChildren()
    })

    for (const child of children) {
      if ($isElementNode(child)) {
        topLevelChildren.push(await getTopLevelChildrenFromElementNode(child, context))
      }

      if ($isHorizontalRuleNode(child)) {
        topLevelChildren.push(createHorizontalRuleChild())
      }

      if ($isPageBreakNode(child)) {
        topLevelChildren.push(createPageBreakChild())
      }
    }

    const document = new Document({
      sections: [
        {
          properties: { type: SectionType.CONTINUOUS },
          children: topLevelChildren.flat(),
        },
      ],
      numbering: {
        config: [
          {
            levels: NumberingLevelsConfig,
            reference: 'numbering',
          },
        ],
      },
    })

    return document
  }
}
