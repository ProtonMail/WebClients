import { $isLinkNode, LinkNode } from '@lexical/link'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import { getSelectedNode } from '../../Utils/getSelectedNode'
import { LinkInfoViewer } from './LinkInfoViewer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'

export const $isLinkTextNode = (
  node: ReturnType<typeof getSelectedNode>,
  selection: RangeSelection,
): node is TextNode => {
  const parent = node.getParent()
  return (
    $isLinkNode(parent) &&
    parent.getChildrenSize() === 1 &&
    $isTextNode(node) &&
    parent.getFirstChild() === node &&
    selection.anchor.getNode() === selection.focus.getNode()
  )
}

export function LinkInfoPlugin() {
  const [editor] = useLexicalComposerContext()

  const [linkNode, setLinkNode] = useState<LinkNode | null>(null)
  const [, setLinkTextNode] = useState<TextNode | null>(null)
  const [isEditingLink, setIsEditingLink] = useState(false)

  const getLinkInfo = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }

    const anchorNode = selection.anchor.getNode()
    const focusNode = selection.focus.getNode()
    const isAnchorSameAsFocus = anchorNode === focusNode

    const node = getSelectedNode(selection)
    const parent = node.getParent()

    if ($isLinkNode(node) && isAnchorSameAsFocus) {
      setLinkNode(node)
    } else if ($isLinkNode(parent) && isAnchorSameAsFocus) {
      setLinkNode(parent)
    } else {
      setLinkNode(null)
    }
    if ($isLinkTextNode(node, selection)) {
      setLinkTextNode(node)
    } else {
      setLinkTextNode(null)
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          getLinkInfo()
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(() => {
        editor.getEditorState().read(getLinkInfo)
      }),
    )
  }, [editor, getLinkInfo])

  if (isEditingLink) {
    return null
  }

  if (linkNode) {
    return <LinkInfoViewer linkNode={linkNode} editor={editor} setIsEditingLink={setIsEditingLink} />
  }

  return null
}
