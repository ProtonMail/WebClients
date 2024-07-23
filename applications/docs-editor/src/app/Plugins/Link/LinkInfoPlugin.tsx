import type { LinkNode } from '@lexical/link'
import { $isLinkNode } from '@lexical/link'
import type { RangeSelection, TextNode } from 'lexical'
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  SELECTION_CHANGE_COMMAND,
  createCommand,
} from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import { getSelectedNode } from '../../Utils/getSelectedNode'
import { LinkInfoViewer } from './LinkInfoViewer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { LinkInfoEditor } from './LinkInfoEditor'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'

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

export const EDIT_LINK_COMMAND = createCommand('EDIT_LINK_COMMAND')

export function LinkInfoPlugin({ openLink }: { openLink: (url: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()

  const [linkNode, setLinkNode] = useState<LinkNode | null>(null)
  const [linkTextNode, setLinkTextNode] = useState<TextNode | null>(null)
  const [isEditingLink, setIsEditingLink] = useState(false)

  useEffect(() => {
    if (!isEditable) {
      setIsEditingLink(false)
    }
  }, [isEditable])

  const getLinkInfo = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }

    const anchorNode = selection.anchor.getNode()
    const focusNode = selection.focus.getNode()
    const isAnchorSameAsFocus = anchorNode === focusNode

    const node = getSelectedNode(selection)
    const parent = $findMatchingParent(node, $isLinkNode)

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
      editor.registerUpdateListener(({ editorState, tags, dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
          return
        }
        editorState.read(getLinkInfo)
        if (tags.has('collaboration') === false) {
          setIsEditingLink(false)
        }
      }),
      editor.registerCommand(
        EDIT_LINK_COMMAND,
        () => {
          setIsEditingLink(true)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, getLinkInfo])

  if (isEditingLink) {
    return (
      <LinkInfoEditor
        editor={editor}
        linkNode={linkNode}
        linkTextNode={linkTextNode}
        setIsEditingLink={setIsEditingLink}
      />
    )
  }

  if (linkNode) {
    return (
      <LinkInfoViewer editor={editor} openLink={openLink} linkNode={linkNode} setIsEditingLink={setIsEditingLink} />
    )
  }

  return null
}
