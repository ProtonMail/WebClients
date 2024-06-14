import { $getRoot, $isElementNode, LexicalEditor } from 'lexical'
import { AlignmentType, Document, ILevelsOptions, LevelFormat, SectionType, convertInchesToTwip } from 'docx'
import { getTopLevelChildrenFromElementNode } from './getTopLevelChildrenFromElementNode'

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

export function generateDocxFromEditor(editor: LexicalEditor): Document {
  const state = editor.getEditorState()

  const children = state.read(() => {
    const children = []

    const root = $getRoot()
    for (const child of root.getChildren()) {
      if ($isElementNode(child)) {
        children.push(getTopLevelChildrenFromElementNode(child))
      }
    }

    return children
  })

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
