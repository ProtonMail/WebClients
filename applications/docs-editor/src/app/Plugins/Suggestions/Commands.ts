import type { LexicalCommand } from 'lexical'
import { createCommand } from 'lexical'

export const ACCEPT_SUGGESTION_COMMAND: LexicalCommand<string> = createCommand('ACCEPT_SUGGESTION_COMMAND')
export const REJECT_SUGGESTION_COMMAND: LexicalCommand<string> = createCommand('REJECT_SUGGESTION_COMMAND')
export const SUGGESTION_MODE_KEYDOWN_COMMAND: LexicalCommand<KeyboardEvent> = createCommand(
  'SUGGESTION_MODE_KEYDOWN_COMMAND',
)
export const TOGGLE_SUGGESTION_MODE_COMMAND: LexicalCommand<undefined> = createCommand('TOGGLE_SUGGESTION_MODE_COMMAND')
