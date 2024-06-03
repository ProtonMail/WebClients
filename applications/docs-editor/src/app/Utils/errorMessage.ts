import {
  EditorBridgeMessageType,
  EditorRequiresClientMethods,
  EditorToClientInvokationMessage,
} from '@proton/docs-shared'
import { GenerateUUID } from '@proton/docs-core'
import { type ErrorInfo } from 'react'

export const sendErrorMessage = (error: Error, errorInfo?: ErrorInfo) => {
  if (window.parent) {
    const message: EditorToClientInvokationMessage<keyof EditorRequiresClientMethods> = {
      messageId: GenerateUUID(),
      functionName: 'reportError',
      args: [error, errorInfo],
      type: EditorBridgeMessageType.EditorToClientInvokation,
    }
    window.parent.postMessage(message, '*')
  }
}
