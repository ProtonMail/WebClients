import { type LexicalEditor, $nodesOfType } from 'lexical'
import { CommentThreadMarkNode, $unwrapCommentThreadMarkNode } from '../Plugins/Comments/CommentThreadMarkNode'

/**
 * Remove comment thread marks from the editor. This cannot be undone directly and is useful for exporting documents.
 */
export function removeCommentThreadMarks(editor: LexicalEditor) {
  editor.update(
    () => {
      const commentMarkNodes = $nodesOfType(CommentThreadMarkNode)
      for (const markNode of commentMarkNodes) {
        $unwrapCommentThreadMarkNode(markNode)
      }
    },
    {
      discrete: true,
    },
  )
}
