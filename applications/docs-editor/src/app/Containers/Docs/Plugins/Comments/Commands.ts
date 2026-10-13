import { createCommand, type CommandPayloadType, type CUT_COMMAND } from 'lexical'

export const CUT_COMMENT_COMMAND = createCommand<CommandPayloadType<typeof CUT_COMMAND>>('CUT_COMMENT_COMMAND')
