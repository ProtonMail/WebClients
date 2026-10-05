import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $getClipboardDataFromSelection,
  $insertGeneratedNodes,
  setLexicalClipboardDataTransfer,
} from '@lexical/clipboard'
import { $sliceSelectedTextNodeContent } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import {
  $cloneWithProperties,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $nodesOfType,
  COMMAND_PRIORITY_NORMAL,
  COPY_COMMAND,
  CUT_COMMAND,
  PASTE_COMMAND,
  PASTE_TAG,
  $addUpdateTag,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLexicalNode,
  type RangeSelection,
} from 'lexical'
import { CommentThreadMarkNode } from './CommentThreadMarkNode'
import { withCommentCutSerialization } from './CommentCutSerialization'

type ClipboardNode = SerializedLexicalNode & { children?: ClipboardNode[]; ids?: string[] }
type PendingMove = {
  editor: LexicalEditor
  documentId: string
  clipboardJSON: string
  nodes: ClipboardNode[]
  ids: Set<string>
}
// Only one live cut can correspond to the system clipboard. Anchor data stays
// in this page's memory; the clipboard receives an opaque, single-use token.
let pendingMove: PendingMove | undefined

function $isFullySelected(node: LexicalNode, selection: RangeSelection): boolean {
  if ($isElementNode(node)) {
    const children = node.getChildren()
    return children.length > 0 && children.every((child) => $isFullySelected(child, selection))
  }
  if (!node.isSelected(selection)) {
    return false
  }
  if ($isTextNode(node)) {
    const selected = $sliceSelectedTextNodeContent(selection, $cloneWithProperties(node))
    return $isTextNode(selected) && selected.__text.length === node.getTextContentSize()
  }
  return true
}

function filterMarkIDs(nodes: ClipboardNode[], allowed: Set<string>): ClipboardNode[] {
  return nodes.flatMap((node) => {
    if (node.children) {
      node.children = filterMarkIDs(node.children, allowed)
    }
    if (node.type === CommentThreadMarkNode.getType()) {
      node.ids = node.ids?.filter((id) => allowed.has(id)) ?? []
      if (node.ids.length === 0) {
        return node.children ?? []
      }
    }
    return [node]
  })
}

export function registerCommentCutMove(
  editor: LexicalEditor,
  documentId: string,
  getExistingThreadMarkIDs: () => Set<string>,
): () => void {
  return mergeRegister(
    editor.registerCommand(
      COPY_COMMAND,
      () => {
        pendingMove = undefined
        return false
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    editor.registerCommand(
      CUT_COMMAND,
      (event) => {
        pendingMove = undefined
        const selection = $getSelection()
        if (
          !editor.isEditable() ||
          !event ||
          !('clipboardData' in event) ||
          !event.clipboardData ||
          !$isRangeSelection(selection) ||
          selection.isCollapsed()
        ) {
          return false
        }
        const marks = $nodesOfType(CommentThreadMarkNode)
        const selected = marks.filter((node) => $isFullySelected(node, selection))
        const ids = new Set(selected.flatMap((node) => node.getIDs()))
        // A thread can span several marks. Preserve it only if all its anchors
        // move; a partial cut leaves the thread attached to the remaining text.
        for (const mark of marks) {
          if (!selected.includes(mark)) {
            mark.getIDs().forEach((id) => ids.delete(id))
          }
        }
        if (ids.size === 0) {
          return false
        }
        const data = $getClipboardDataFromSelection(selection)
        const nodes = withCommentCutSerialization(
          editor,
          ids,
          () => $generateJSONFromSelectedNodes(editor, selection).nodes,
        ) as ClipboardNode[]
        try {
          // Carry only an opaque token in Lexical's existing clipboard format.
          // It survives wherever normal rich Docs clipboard data survives, and
          // other editors simply ignore the extra field.
          const payload = JSON.parse(data['application/x-lexical-editor'] ?? '')
          data['application/x-lexical-editor'] = JSON.stringify({
            ...payload,
            protonCommentMoveToken: crypto.randomUUID(),
          })
          setLexicalClipboardDataTransfer(event.clipboardData, data)
        } catch {
          // Fall back to the normal cut handler if rich clipboard data cannot be written.
          return false
        }
        event.preventDefault()
        pendingMove = {
          editor,
          documentId,
          clipboardJSON: data['application/x-lexical-editor'] ?? '',
          nodes: filterMarkIDs(nodes, ids),
          ids,
        }
        selection.removeText()
        return true
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!event || !('clipboardData' in event) || !event.clipboardData) {
          return false
        }
        const move = pendingMove
        pendingMove = undefined
        const selection = $getSelection()
        if (
          !move ||
          !editor.isEditable() ||
          move.editor !== editor ||
          move.documentId !== documentId ||
          event.clipboardData.getData('application/x-lexical-editor') !== move.clipboardJSON ||
          !$isRangeSelection(selection)
        ) {
          return false
        }
        // Undo or a peer may already have restored some anchors. Never duplicate
        // those IDs, or resurrect a comment that has since been deleted.
        const existing = getExistingThreadMarkIDs()
        const allowed = new Set([...move.ids].filter((id) => existing.has(id)))
        for (const mark of $nodesOfType(CommentThreadMarkNode)) {
          mark.getIDs().forEach((id) => allowed.delete(id))
        }
        if (allowed.size === 0) {
          return false
        }
        const nodes = $generateNodesFromSerializedNodes(filterMarkIDs(move.nodes, allowed))
        $addUpdateTag(PASTE_TAG)
        $insertGeneratedNodes(editor, nodes, selection)
        event.preventDefault()
        return true
      },
      COMMAND_PRIORITY_NORMAL,
    ),
    () => {
      if (pendingMove?.editor === editor) {
        pendingMove = undefined
      }
    },
  )
}
