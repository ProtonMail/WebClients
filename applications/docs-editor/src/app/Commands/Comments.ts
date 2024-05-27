import { LexicalCommand, createCommand } from 'lexical'

export const INSERT_INLINE_COMMENT_COMMAND: LexicalCommand<void> = createCommand('INSERT_INLINE_COMMAND')
export const SHOW_ALL_COMMENTS_COMMAND: LexicalCommand<void> = createCommand('SHOW_ALL_COMMENTS_COMMAND')
