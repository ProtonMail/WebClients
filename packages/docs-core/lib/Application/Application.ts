import type { Api } from '@proton/shared/lib/interfaces'
import { App_TYPES } from './Dependencies/Types'
import { AppDependencies } from './Dependencies/AppDependencies'
import type { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import type { DocLoader } from '../Services/DocumentLoader/DocLoader'
import type { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import { SyncedEditorState, type InternalEventBusInterface } from '@proton/docs-shared'
import type { ApplicationInterface } from './ApplicationInterface'
import type { WebsocketServiceInterface } from '../Services/Websockets/WebsocketServiceInterface'
import type { LoggerInterface } from '@proton/utils/logs'
import type { ImageProxyParams } from '../Api/Types/ImageProxyParams'
import type { CustomWindow } from './Window'
import type { RecentDocumentsInterface } from '../Services/RecentDocuments/types'
import type { MetricService } from '../Services/Metrics/MetricService'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { PublicDocLoader } from '../Services/DocumentLoader/PublicDocLoader'
import type { HttpHeaders } from '../Api/DocsApi'
import type { DuplicateDocument } from '../UseCase/DuplicateDocument'
import type { UnleashClient } from '@proton/unleash'
import { UserState } from '../State/UserState'
import type { DocumentState, PublicDocumentState } from '../State/DocumentState'
import type { PublicDocControllerInterface } from '../Controller/Document/PublicDocControllerInterface'
import type { AnyDocControllerInterface } from '../Controller/Document/AnyDocControllerInterface'

declare const window: CustomWindow

export class Application implements ApplicationInterface {
  public readonly userState = new UserState()
  public readonly syncedEditorState = new SyncedEditorState()

  private readonly deps = new AppDependencies(
    this.protonApi,
    this.imageProxyParams,
    this.publicContextHeaders,
    this.compatWrapper,
    this.userState,
    this.appVersion,
    this.unleashClient,
  )

  constructor(
    private protonApi: Api,
    private publicContextHeaders: HttpHeaders | undefined,
    private imageProxyParams: ImageProxyParams | undefined,
    public readonly compatWrapper: DriveCompatWrapper,
    private appVersion: string,
    private unleashClient: UnleashClient,
  ) {
    this.deps.get<MetricService>(App_TYPES.MetricService).initialize()
  }

  destroy(): void {
    this.logger.info('Destroying application')

    this.websocketService.destroy()

    if (!this.compatWrapper.publicCompat) {
      this.privateDocLoader.destroy()
    } else {
      this.publicDocLoader.destroy()
    }

    this.eventBus.deinit()
  }

  public get metrics(): MetricService {
    return this.deps.get<MetricService>(App_TYPES.MetricService)
  }

  public get eventBus(): InternalEventBusInterface {
    return this.deps.get<InternalEventBusInterface>(App_TYPES.EventBus)
  }

  public get logger(): LoggerInterface {
    return this.deps.get<LoggerInterface>(App_TYPES.Logger)
  }

  public getDocLoader(): DocLoaderInterface<DocumentState | PublicDocumentState, AnyDocControllerInterface> {
    if (this.compatWrapper.publicCompat) {
      return this.publicDocLoader
    } else {
      return this.privateDocLoader
    }
  }

  private get publicDocLoader(): DocLoaderInterface<PublicDocumentState, PublicDocControllerInterface> {
    if (!this.compatWrapper.publicCompat) {
      throw new Error('Public mode is not supported in private mode')
    }

    return this.deps.get<PublicDocLoader>(App_TYPES.PublicDocLoader)
  }

  private get privateDocLoader(): DocLoaderInterface<DocumentState, AnyDocControllerInterface> {
    if (this.compatWrapper.publicCompat) {
      throw new Error('Private mode is not supported in public mode')
    }

    return this.deps.get<DocLoader>(App_TYPES.DocLoader)
  }

  public get isPublicMode(): boolean {
    return !!this.compatWrapper.publicCompat
  }

  public get createEmptyDocumentForConversionUseCase(): CreateEmptyDocumentForConversion {
    return this.deps.get<CreateEmptyDocumentForConversion>(App_TYPES.CreateEmptyDocumentForConversion)
  }

  public get duplicateDocumentUseCase(): DuplicateDocument {
    return this.deps.get<DuplicateDocument>(App_TYPES.DuplicateDocument)
  }

  public get websocketService(): WebsocketServiceInterface {
    return this.deps.get<WebsocketServiceInterface>(App_TYPES.WebsocketService)
  }

  public get recentDocumentsService(): RecentDocumentsInterface {
    return this.deps.get<RecentDocumentsInterface>(App_TYPES.RecentDocumentsService)
  }

  public get isRunningInNativeMobileWeb(): boolean {
    return window.Android != null || window.webkit?.messageHandlers?.iOS != null
  }
}
