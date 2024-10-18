import type { ElementNode } from 'lexical'
import { createCommand } from 'lexical'

export const SET_BLOCK_TYPE_COMMAND = createCommand<() => ElementNode>('SET_BLOCK_TYPE_COMMAND')
