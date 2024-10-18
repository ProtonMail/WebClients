import type { LoggerInterface } from '@proton/utils/logs'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import { EditorOrchestrator } from '../Orchestrator/EditorOrchestrator'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { PublicDriveCompat, PublicNodeMeta } from '@proton/drive-store'
import type { DocLoaderInterface } from './DocLoaderInterface'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { DocsApi } from '../../Api/DocsApi'
import type { PublicDocControllerInterface } from '../../Controller/Document/PublicDocControllerInterface'
import { PublicDocController } from '../../Controller/Document/PublicDocController'

export type StatusObserver = {
  onSuccess: (orchestrator: EditorOrchestratorInterface) => void
  onError: (error: string) => void
}

export class PublicDocLoader implements DocLoaderInterface {
  private publicDocController?: PublicDocControllerInterface
  private orchestrator?: EditorOrchestratorInterface
  private readonly statusObservers: StatusObserver[] = []

  constructor(
    private driveCompat: PublicDriveCompat,
    private docsApi: DocsApi,
    private loadDocument: LoadDocument,
    private loadCommit: LoadCommit,
    private getDocumentMeta: GetDocumentMeta,
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

    this.publicDocController = new PublicDocController(
      nodeMeta,
      this.loadDocument,
      this.loadCommit,
      this.getDocumentMeta,
      this.exportAndDownload,
      this.eventBus,
      this.logger,
    )

    const result = await this.publicDocController.initialize()

    if (result.isFailed()) {
      this.statusObservers.forEach((observer) => {
        observer.onError(result.getError())
      })
      return
    }

    const { entitlements, meta } = result.getValue()

    if (entitlements.role.isPublicViewerWithAccess()) {
      this.logger.info('Redirecting to authed document')
      this.driveCompat.redirectToAuthedDocument(meta.nodeMeta)
      return
    }

    this.orchestrator = new EditorOrchestrator(undefined, this.publicDocController, this.docsApi, this.eventBus)

    this.statusObservers.forEach((observer) => {
      if (this.orchestrator) {
        observer.onSuccess(this.orchestrator)
      }
    })
  }

  public getDocController(): PublicDocControllerInterface {
    if (!this.publicDocController) {
      throw new Error('DocController not ready')
    }

    return this.publicDocController
  }

  public addStatusObserver(observer: StatusObserver): () => void {
    this.statusObservers.push(observer)

    if (this.orchestrator) {
      observer.onSuccess(this.orchestrator)
    }

    return () => {
      this.statusObservers.splice(this.statusObservers.indexOf(observer), 1)
    }
  }
}
