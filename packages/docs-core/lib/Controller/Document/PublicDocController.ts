import type { LoggerInterface } from '@proton/utils/logs'
import type { DecryptedNode, PublicNodeMeta } from '@proton/drive-store'
import type {
  InternalEventBusInterface,
  ClientRequiresEditorMethods,
  DocumentMetaInterface,
  DataTypesThatDocumentCanBeExportedAs,
  WebsocketConnectionInterface,
} from '@proton/docs-shared'
import { DocUpdateOrigin, DocumentRole } from '@proton/docs-shared'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { DecryptedCommit } from '../../Models/DecryptedCommit'
import type { PublicDocLoadSuccessResult } from './DocLoadSuccessResult'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { DocControllerEventPayloads } from './DocControllerEvent'
import { DocControllerEvent } from './DocControllerEvent'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import { Result } from '../../Domain/Result/Result'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { PublicDocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { SerializedEditorState } from 'lexical'
import type { AnyDocControllerInterface } from './AnyDocControllerInterface'

/**
 * Controls the lifecycle of a single public document.
 */
export class PublicDocController implements AnyDocControllerInterface {
  entitlements: PublicDocumentEntitlements | null = null
  private decryptedNode?: DecryptedNode
  editorInvoker?: ClientRequiresEditorMethods
  docMeta!: DocumentMetaInterface
  private initialCommit?: DecryptedCommit

  docsServerDataReady = false
  didAlreadyReceiveEditorReadyEvent = false

  isDestroyed = false

  constructor(
    private readonly nodeMeta: PublicNodeMeta,
    private _loadDocument: LoadDocument,
    readonly _loadCommit: LoadCommit,
    readonly _getDocumentMeta: GetDocumentMeta,
    private _exportAndDownload: ExportAndDownload,
    readonly eventBus: InternalEventBusInterface,
    readonly logger: LoggerInterface,
  ) {}

  destroy(): void {
    this.isDestroyed = true
  }

  public get role(): DocumentRole {
    if (!this.entitlements) {
      return new DocumentRole('PublicViewer')
    }

    return this.entitlements.role
  }

  async editorIsReadyToReceiveInvocations(editorInvoker: ClientRequiresEditorMethods): Promise<void> {
    if (this.editorInvoker) {
      throw new Error('Editor invoker already set')
    }

    this.editorInvoker = editorInvoker

    this.logger.info('Editor is ready to receive invocations')

    await this.sendInitialCommitToEditor()

    this.showEditorIfAllConnectionsReady()
  }

  public getSureDocument(): DocumentMetaInterface {
    if (!this.docMeta) {
      throw new Error('Attempting to access document before it is initialized')
    }

    return this.docMeta
  }

  public async initialize(): Promise<Result<PublicDocLoadSuccessResult>> {
    const loadResult = await this._loadDocument.executePublic(this.nodeMeta)
    if (loadResult.isFailed()) {
      this.logger.error('Failed to load document', loadResult.getError())
      return Result.fail(loadResult.getError())
    }

    const { entitlements, meta, lastCommitId, node } = loadResult.getValue()
    this.logger.info(`Loaded document meta with last commit id ${lastCommitId}`)

    this.entitlements = entitlements
    this.docMeta = meta
    this.decryptedNode = node

    let connection: WebsocketConnectionInterface | undefined

    if (lastCommitId) {
      const decryptResult = await this._loadCommit.execute(
        this.nodeMeta,
        lastCommitId,
        entitlements.keys.documentContentKey,
      )
      if (decryptResult.isFailed()) {
        this.logger.error('Failed to load commit', decryptResult.getError())
        connection?.destroy()

        return Result.fail(decryptResult.getError())
      }

      const decryptedCommit = decryptResult.getValue()
      this.logger.info(`Downloaded and decrypted commit with ${decryptedCommit?.numberOfUpdates()} updates`)

      void this.setInitialCommit(decryptedCommit)
    }

    this.eventBus.publish({
      type: DocControllerEvent.DidLoadInitialEditorContent,
      payload: undefined,
    })

    this.handleDocsDataLoaded()

    this.eventBus.publish<DocControllerEventPayloads['DidLoadDocumentTitle']>({
      type: DocControllerEvent.DidLoadDocumentTitle,
      payload: { title: this.docMeta.name },
    })

    return Result.ok({
      entitlements: this.entitlements,
      meta: this.docMeta,
    })
  }

  private handleDocsDataLoaded(): void {
    this.docsServerDataReady = true
    this.showEditorIfAllConnectionsReady()
  }

  showEditorIfAllConnectionsReady(): void {
    if (!this.docsServerDataReady || !this.editorInvoker) {
      return
    }

    this.showEditor()
  }

  showEditor(): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    this.logger.info('Showing editor and allowing editing')

    void this.editorInvoker.showEditor()
    void this.editorInvoker.performOpeningCeremony()
  }

  async setInitialCommit(decryptedCommit: DecryptedCommit | undefined): Promise<void> {
    this.initialCommit = decryptedCommit

    if (!decryptedCommit) {
      return
    }

    await this.sendInitialCommitToEditor()
  }

  async sendInitialCommitToEditor(): Promise<void> {
    if (this.docMeta && this.initialCommit && this.editorInvoker) {
      const squashedContent = this.initialCommit.squashedRepresentation()

      this.logger.info(`Sending initial commit to editor with size ${squashedContent.byteLength} bytes`)

      await this.editorInvoker.receiveMessage({
        type: { wrapper: 'du' },
        content: squashedContent,
        origin: DocUpdateOrigin.InitialLoad,
      })
    }
  }

  public async getDocumentClientId(): Promise<number | undefined> {
    if (this.editorInvoker) {
      return this.editorInvoker.getClientId()
    }

    return undefined
  }

  async exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array> {
    if (!this.editorInvoker || !this.decryptedNode) {
      throw new Error(`Attepting to export document before editor invoker or decrypted node is initialized`)
    }

    return this.editorInvoker.exportData(format)
  }

  async exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    if (!this.editorInvoker || !this.decryptedNode) {
      throw new Error(`Attepting to export document before editor invoker or decrypted node is initialized`)
    }

    const data = await this.exportData(format)

    await this._exportAndDownload.execute(data, this.decryptedNode?.name, format)
  }

  async printAsPDF(): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.printAsPDF()
  }

  async getEditorJSON(): Promise<SerializedEditorState | undefined> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const json = await this.editorInvoker.getCurrentEditorState()
    return json
  }

  async toggleDebugTreeView(): Promise<void> {
    void this.editorInvoker?.toggleDebugTreeView()
  }

  deinit() {}
}
