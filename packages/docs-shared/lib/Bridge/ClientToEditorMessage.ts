import { ClientRequiresEditorMethods } from './ClientRequiresEditorMethods'
import { EditorBridgeMessageType } from './EditorBridgeMessageType'
import { ParamsExcludingFunctions } from './Utils'

export type ClientToEditorGenericMessage = {
  type: EditorBridgeMessageType.ClientToEditorInvokation | EditorBridgeMessageType.ClientToEditorReply
}

export type ClientToEditorReplyMessage = {
  messageId: string
  returnValue: unknown
  type: EditorBridgeMessageType.ClientToEditorReply
}

export type ClientToEditorInvokationMessage<K extends keyof ClientRequiresEditorMethods> = {
  messageId: string
  functionName: K
  args: ParamsExcludingFunctions<Parameters<ClientRequiresEditorMethods[K]>>
  type: EditorBridgeMessageType.ClientToEditorInvokation
}
