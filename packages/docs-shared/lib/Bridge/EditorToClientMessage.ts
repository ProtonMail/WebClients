import { ParamsExcludingFunctions } from './Utils'
import { EditorRequiresClientMethods } from './EditorRequiresClientMethods'
import { EditorBridgeMessageType } from './EditorBridgeMessageType'

export type EditorToClientGenericMessage = {
  type: EditorBridgeMessageType.EditorToClientInvokation | EditorBridgeMessageType.EditorToClientReply
}

export type EditorToClientReplyMessage = {
  messageId: string
  returnValue: unknown
  type: EditorBridgeMessageType.EditorToClientReply
}

export type EditorToClientInvokationMessage<K extends keyof EditorRequiresClientMethods> = {
  messageId: string
  functionName: K
  args: ParamsExcludingFunctions<Parameters<EditorRequiresClientMethods[K]>>
  type: EditorBridgeMessageType.EditorToClientInvokation
}
