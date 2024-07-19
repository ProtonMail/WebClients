import type { ClientRequiresEditorMethods } from './ClientRequiresEditorMethods'
import type { EditorBridgeMessageType } from './EditorBridgeMessageType'
import type { ParamsExcludingFunctions } from './Utils'

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
