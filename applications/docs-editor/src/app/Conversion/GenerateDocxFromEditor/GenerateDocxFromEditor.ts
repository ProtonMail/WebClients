import { $getRoot, $isElementNode, LexicalEditor } from 'lexical'
import { AlignmentType, Document, ILevelsOptions, LevelFormat, SectionType, convertInchesToTwip } from 'docx'
import { getTopLevelChildrenFromElementNode } from './getTopLevelChildrenFromElementNode'
import { DocxExportContext } from './Context'

export const DummyElementUsedToConvertTextNodeCSSTextToComputedStyles = document.createElement('span')

const NumberingFormat: Record<number, (typeof LevelFormat)[keyof typeof LevelFormat]> = {
  0: LevelFormat.DECIMAL,
  1: LevelFormat.UPPER_LETTER,
  2: LevelFormat.LOWER_LETTER,
  3: LevelFormat.UPPER_ROMAN,
  4: LevelFormat.LOWER_ROMAN,
}

const NumberingLevelsConfig: ILevelsOptions[] = Array.from({ length: 5 }, (_, i) => ({
  level: i,
  format: NumberingFormat[i],
  text: `%${i + 1}.`,
  alignment: AlignmentType.START,
  style: {
    paragraph: {
      indent: { left: convertInchesToTwip(0.5 * i), hanging: convertInchesToTwip(0.18) },
    },
  },
}))

export async function generateDocxFromEditor(
  editor: LexicalEditor,
  callbacks: {
    fetchExternalImageAsBase64: DocxExportContext['fetchExternalImageAsBase64']
  },
): Promise<Document> {
  const state = editor.getEditorState()

  const context: DocxExportContext = {
    state,
    fetchExternalImageAsBase64: callbacks.fetchExternalImageAsBase64,
  }

  const topLevelChildren: ReturnType<typeof getTopLevelChildrenFromElementNode>[] = []

  state.read(() => {
    const root = $getRoot()
    for (const child of root.getChildren()) {
      if ($isElementNode(child)) {
        topLevelChildren.push(getTopLevelChildrenFromElementNode(child, context))
      }
    }
  })

  const children = await Promise.all(topLevelChildren)

  const document = new Document({
    sections: [
      {
        properties: { type: SectionType.CONTINUOUS },
        children: children.flat(),
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
