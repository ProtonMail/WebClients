import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import type { ElementNode, LexicalNode } from 'lexical'
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $createCodeNode, $isCodeNode } from '@lexical/code'

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'code' | 'quote'

export const blockTypeToBlockName: { [k in BlockType]: string } = {
  paragraph: 'Normal',
  h1: 'Title',
  h2: 'Heading 1',
  h3: 'Heading 2',
  h4: 'Heading 3',
  h5: 'Heading 4',
  h6: 'Heading 5',
  code: 'Code block',
  quote: 'Quote',
}

export const blockTypeToCreateElementFn: { [k in BlockType]: () => ElementNode } = {
  paragraph: () => $createParagraphNode(),
  h1: () => $createHeadingNode('h1'),
  h2: () => $createHeadingNode('h2'),
  h3: () => $createHeadingNode('h3'),
  h4: () => $createHeadingNode('h4'),
  h5: () => $createHeadingNode('h5'),
  h6: () => $createHeadingNode('h6'),
  code: () => $createCodeNode(),
  quote: () => $createQuoteNode(),
}

/**
 * Returns the block type for a given node.
 */
export function $getElementBlockType(element: LexicalNode): BlockType | null {
  if (!$isRootOrShadowRoot(element.getParent())) {
    return null
  }

  if ($isCodeNode(element)) {
    return 'code'
  } else if ($isQuoteNode(element)) {
    return 'quote'
  } else if ($isHeadingNode(element)) {
    return element.getTag()
  } else if ($isParagraphNode(element)) {
    return 'paragraph'
  }

  return null
}

export const SET_BLOCK_TYPE_COMMAND = createCommand<BlockType>('SET_BLOCK_TYPE_COMMAND')

export function BlockTypePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      SET_BLOCK_TYPE_COMMAND,
      (blockType) => {
        const selection = $getSelection()
        const createElement = blockTypeToCreateElementFn[blockType]
        $setBlocksType(selection, createElement)
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
