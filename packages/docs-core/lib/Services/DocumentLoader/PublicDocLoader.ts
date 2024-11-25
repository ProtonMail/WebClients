import type { LoggerInterface } from '@proton/utils/logs'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import { EditorOrchestrator } from '../Orchestrator/EditorOrchestrator'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { PublicDriveCompat, PublicNodeMeta } from '@proton/drive-store'
import type { DocLoaderInterface } from './DocLoaderInterface'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { DocsApi } from '../../Api/DocsApi'
import type { PublicDocControllerInterface } from '../../Controller/Document/PublicDocControllerInterface'
import { PublicDocController } from '../../Controller/Document/PublicDocController'
import type { EditorControllerInterface } from '../../Controller/Document/EditorController'
import { EditorController } from '../../Controller/Document/EditorController'
import { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { DocLoaderStatusObserver } from './StatusObserver'

export class PublicDocLoader implements DocLoaderInterface<PublicDocumentState, PublicDocControllerInterface> {
  private publicDocController?: PublicDocControllerInterface
  private editorController?: EditorControllerInterface
  private orchestrator?: EditorOrchestratorInterface
  private documentState?: PublicDocumentState
  private readonly statusObservers: DocLoaderStatusObserver<PublicDocumentState, PublicDocControllerInterface>[] = []

  constructor(
    private driveCompat: PublicDriveCompat,
    private docsApi: DocsApi,
    private loadDocument: LoadDocument,
    private exportAndDownload: ExportAndDownload,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {}

  destroy(): void {
    this.publicDocController?.destroy()
  }

  public async initialize(nodeMeta: PublicNodeMeta): Promise<void> {
    if (this.publicDocController) {
      throw new Error('[PublicDocLoader] docController already initialized')
    }

    const loadResult = await this.loadDocument.executePublic(nodeMeta)
    if (loadResult.isFailed()) {
      this.logger.error('Failed to load document', loadResult.getError())
      this.statusObservers.forEach((observer) => {
        observer.onError(loadResult.getError())
      })
      return
    }

    const { entitlements, meta, node, decryptedCommit } = loadResult.getValue()
    this.logger.info(`Loaded document meta with last commit id ${meta.latestCommitId()}`)

    const documentState = new PublicDocumentState({
      ...DocumentState.defaults,
      realtimeEnabled: false,
      documentMeta: meta,
      userRole: entitlements.role,
      decryptedNode: node,
      entitlements,
      documentName: meta.name,
      currentCommitId: meta.latestCommitId(),
      baseCommit: decryptedCommit,
      documentTrashState: node.trashed ? 'trashed' : 'not_trashed',
    })
    this.documentState = documentState

    const editorController = new EditorController(this.logger, this.exportAndDownload, this.documentState)
    this.editorController = editorController

    const publicDocController = new PublicDocController(nodeMeta, this.eventBus, this.logger)
    this.publicDocController = publicDocController

    if (entitlements.role.isPublicViewerWithAccess()) {
      this.logger.info('Redirecting to authed document')
      this.driveCompat.redirectToAuthedDocument(meta.nodeMeta)
      return
    }

    this.orchestrator = new EditorOrchestrator(
      undefined,
      this.publicDocController,
      this.docsApi,
      this.eventBus,
      this.editorController,
      this.documentState,
    )

    this.statusObservers.forEach((observer) => {
      if (this.orchestrator) {
        observer.onSuccess({
          orchestrator: this.orchestrator,
          documentState: documentState,
          docController: publicDocController,
          editorController: editorController,
        })
      }
    })
  }

  public addStatusObserver(
    observer: DocLoaderStatusObserver<PublicDocumentState, PublicDocControllerInterface>,
  ): () => void {
    this.statusObservers.push(observer)

    if (this.orchestrator && this.documentState && this.publicDocController && this.editorController) {
      observer.onSuccess({
        orchestrator: this.orchestrator,
        documentState: this.documentState,
        docController: this.publicDocController,
        editorController: this.editorController,
      })
    }

    return () => {
      this.statusObservers.splice(this.statusObservers.indexOf(observer), 1)
    }
  }
}
