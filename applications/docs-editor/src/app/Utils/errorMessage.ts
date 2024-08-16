import type { EditorRequiresClientMethods, EditorToClientInvokationMessage } from '@proton/docs-shared'
import { EditorBridgeMessageType } from '@proton/docs-shared'
import { GenerateUUID } from '@proton/docs-core'
import { type ErrorInfo } from 'react'

export const sendErrorMessage = (error: unknown, errorInfo?: ErrorInfo) => {
  console.error(error, errorInfo)
  if (window.parent) {
    let errorArg: Error = error instanceof Error ? error : new Error(String(error))

    const message: EditorToClientInvokationMessage<keyof EditorRequiresClientMethods> = {
      messageId: GenerateUUID(),
      functionName: 'reportError',
      args: [errorArg, 'devops-only', { errorInfo }],
      type: EditorBridgeMessageType.EditorToClientInvokation,
    }

    window.parent.postMessage(message, '*')
  }
}
