import { BridgeOriginProvider } from '@proton/docs-shared/Bridge/BridgeOriginProvider'
import type { ClientRequiresEditorMethods } from '@proton/docs-shared/Bridge/ClientRequiresEditorMethods'
import type { ClientToEditorInvokationMessage } from '@proton/docs-shared/Bridge/ClientToEditorMessage'
import { EditorBridgeMessageType } from '@proton/docs-shared/Bridge/EditorBridgeMessageType'
import type { EditorToClientReplyMessage } from '@proton/docs-shared/Bridge/EditorToClientMessage'
import type { ParamsExcludingFunctions } from '@proton/docs-shared/Bridge/Utils'
import type { DocumentRoleType } from '@proton/docs-shared/Doc/DocumentRole'
import type { RtsMessagePayload } from '@proton/docs-shared/Doc/RtsMessagePayload'
import type { EditorInitializationConfig } from '@proton/docs-shared/EditorInitializationConfig'
import { GenerateUUID } from '@proton/docs-shared/GenerateUuid'
import type { SyncedEditorEvent, SyncedEditorStateValues } from '@proton/docs-shared/State/SyncedEditorState'
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings'
import type { SerializedEditorState } from 'lexical'

export const EDITOR_CALL_TIMEOUT_MS = 10_000

type EditorMethodsCalledByDoc2 = Pick<
  ClientRequiresEditorMethods,
  | 'initializeEditor'
  | 'receiveMessage'
  | 'showEditor'
  | 'changeLockedState'
  | 'setTableOfContentsVisible'
  | 'loadUserSettings'
  | 'setDarkMode'
  | 'syncProperty'
  | 'getClientId'
  | 'broadcastPresenceState'
  | 'syncEvent'
  | 'getCurrentEditorState'
  | 'getYDocAsJSON'
  | 'toggleDebugTreeView'
>

// Copied from docs-core `Bridge/EditorInvoker.ts`, which doc2 must not import, with only the methods doc2 calls.
// Unlike it, a call the editor doesn't answer within EDITOR_CALL_TIMEOUT_MS rejects instead of waiting forever.
export class EditorInvoker implements EditorMethodsCalledByDoc2 {
  private pendingMessages = new Map<string, (returnValue: unknown) => void>()

  constructor(private editorFrame: HTMLIFrameElement) {}

  async showEditor(): Promise<void> {
    return this.invokeEditorMethod('showEditor', [])
  }

  async receiveMessage(message: RtsMessagePayload): Promise<void> {
    return this.invokeEditorMethod('receiveMessage', [message])
  }

  async changeLockedState(locked: boolean): Promise<void> {
    return this.invokeEditorMethod('changeLockedState', [locked])
  }

  async setTableOfContentsVisible(visible: boolean): Promise<void> {
    return this.invokeEditorMethod('setTableOfContentsVisible', [visible])
  }

  async loadUserSettings(settings: UserSettings): Promise<void> {
    return this.invokeEditorMethod('loadUserSettings', [settings])
  }

  async setDarkMode(isDarkMode: boolean): Promise<void> {
    return this.invokeEditorMethod('setDarkMode', [isDarkMode])
  }

  async syncProperty(
    property: keyof SyncedEditorStateValues,
    value: SyncedEditorStateValues[keyof SyncedEditorStateValues],
  ): Promise<void> {
    return this.invokeEditorMethod('syncProperty', [property, value])
  }

  async getClientId(): Promise<number> {
    return this.invokeEditorMethod('getClientId', [])
  }

  async broadcastPresenceState(): Promise<void> {
    return this.invokeEditorMethod('broadcastPresenceState', [])
  }

  async syncEvent(event: SyncedEditorEvent): Promise<void> {
    return this.invokeEditorMethod('syncEvent', [event])
  }

  async getCurrentEditorState(): Promise<SerializedEditorState | undefined> {
    return this.invokeEditorMethod('getCurrentEditorState', [])
  }

  async getYDocAsJSON(): Promise<unknown> {
    return this.invokeEditorMethod('getYDocAsJSON', [])
  }

  async toggleDebugTreeView(): Promise<void> {
    return this.invokeEditorMethod('toggleDebugTreeView', [])
  }

  async initializeEditor(
    documentId: string,
    userAddress: string,
    documentRole: DocumentRoleType,
    isPublicMode: boolean,
    appVersion: string,
    editorInitializationConfig?: EditorInitializationConfig,
  ): Promise<void> {
    return this.invokeEditorMethod('initializeEditor', [
      documentId,
      userAddress,
      documentRole,
      isPublicMode,
      appVersion,
      editorInitializationConfig,
    ])
  }

  public handleReplyFromEditor(message: EditorToClientReplyMessage): void {
    const resolve = this.pendingMessages.get(message.messageId)
    if (resolve) {
      this.pendingMessages.delete(message.messageId)
      resolve(message.returnValue)
    }
  }

  private async invokeEditorMethod<K extends keyof EditorMethodsCalledByDoc2>(
    functionName: K,
    args: ParamsExcludingFunctions<Parameters<ClientRequiresEditorMethods[K]>>,
  ): Promise<ReturnType<ClientRequiresEditorMethods[K]>> {
    const contentWindow = this.editorFrame.contentWindow
    if (!contentWindow) {
      throw new Error(`Attempting to invoke ${functionName} before editor contentWindow is ready`)
    }

    const messageId = GenerateUUID()

    const message: ClientToEditorInvokationMessage<K> = {
      type: EditorBridgeMessageType.ClientToEditorInvokation,
      functionName,
      args,
      messageId,
    }

    return new Promise<ReturnType<ClientRequiresEditorMethods[K]>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId)
        reject(new Error(`Editor did not answer ${functionName} within ${EDITOR_CALL_TIMEOUT_MS} ms`))
      }, EDITOR_CALL_TIMEOUT_MS)

      this.pendingMessages.set(messageId, (returnValue) => {
        clearTimeout(timeout)
        resolve(returnValue as ReturnType<ClientRequiresEditorMethods[K]>)
      })

      contentWindow.postMessage(message, BridgeOriginProvider.GetEditorOrigin())
    })
  }
}
