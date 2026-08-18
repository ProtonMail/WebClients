import type { LexicalCommand, LexicalNode, NodeKey } from 'lexical'
import { createCommand } from 'lexical'

export const INSERT_IMAGE_NODE_COMMAND: LexicalCommand<LexicalNode> = createCommand('INSERT_IMAGE_NODE_COMMAND')

export type SetImageSizePayload = {
  nodeKey: NodeKey
  width: number | 'inherit'
  height: number | 'inherit'
}

export const SET_IMAGE_SIZE_COMMAND: LexicalCommand<SetImageSizePayload> = createCommand('SET_IMAGE_SIZE_COMMAND')
