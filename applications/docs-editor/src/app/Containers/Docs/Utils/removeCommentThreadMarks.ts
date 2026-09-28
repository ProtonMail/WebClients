import { type LexicalEditor, $nodesOfType } from 'lexical'
import { CommentThreadMarkNode, $unwrapCommentThreadMarkNode } from '../Plugins/Comments/CommentThreadMarkNode'

export function $unwrapAllCommentThreadMarks() {
  const commentMarkNodes = $nodesOfType(CommentThreadMarkNode)
  for (const markNode of commentMarkNodes) {
    $unwrapCommentThreadMarkNode(markNode)
  }
}

/**
 * Remove comment thread marks from the editor. This cannot be undone directly and is useful for exporting documents.
 */
export function removeCommentThreadMarks(editor: LexicalEditor) {
  editor.update(
    () => {
      $unwrapAllCommentThreadMarks()
    },
    {
      discrete: true,
    },
  )
}
