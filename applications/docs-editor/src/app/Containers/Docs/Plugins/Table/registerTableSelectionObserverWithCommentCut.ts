import { registerTableSelectionObserver } from '@lexical/table'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_CRITICAL, CUT_COMMAND, type LexicalEditor } from 'lexical'
import { CUT_COMMENT_COMMAND } from '../Comments/Commands'

export function registerTableSelectionObserverWithCommentCut(editor: LexicalEditor): () => void {
  return mergeRegister(
    // Temporary workaround for Lexical 0.31.2: table observers consume all range
    // cuts at CRITICAL priority, even outside tables, before comment moves run.
    // Lexical 0.38.0 lowers table handlers to HIGH:
    // https://github.com/facebook/lexical/pull/7933
    // After upgrading to >= 0.38.0, register the comment CUT_COMMAND handler at
    // CRITICAL, restore registerTableSelectionObserver(editor, true) in TablePlugin,
    // and remove this wrapper and CUT_COMMENT_COMMAND. Re-run the table/comment
    // cut tests before removing the workaround. Until then, the separate command
    // lets comments remount without depending on their CUT_COMMAND listener order.
    editor.registerCommand(
      CUT_COMMAND,
      (event) => editor.dispatchCommand(CUT_COMMENT_COMMAND, event),
      COMMAND_PRIORITY_CRITICAL,
    ),
    registerTableSelectionObserver(editor, true),
  )
}
