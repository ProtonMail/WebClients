import type { LoggerInterface } from '@proton/utils/logs'
import { Logger } from '@proton/utils/logs'
import { DOCS_DEBUG_KEY, DependencyContainer } from '@proton/docs-shared'
import { App_TYPES } from './Types'
import type { HttpHeaders } from '../../Api/Types/HttpHeaders'
import { DocsApi } from '../../Api/DocsApi'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { DocLoader } from '../../Services/DocumentLoader/DocLoader'
import type { InternalEventBusInterface, SyncedEditorState } from '@proton/docs-shared'
import { InternalEventBus } from '@proton/docs-shared'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { Api } from '@proton/shared/lib/interfaces'
import { EncryptionService } from '../../Services/Encryption/EncryptionService'
import { EncryptComment } from '../../UseCase/EncryptComment'
import { DecryptComment } from '../../UseCase/DecryptComment'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { CreateEmptyDocumentForConversion } from '../../UseCase/CreateEmptyDocumentForConversion'
import { FetchRealtimeToken } from '../../UseCase/FetchRealtimeToken'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { GetCommitData } from '../../UseCase/GetCommitData'
import { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import { EncryptionContext } from '../../Services/Encryption/EncryptionContext'
import { VerifyCommit } from '../../UseCase/VerifyCommit'
import { DecryptCommit } from '../../UseCase/DecryptCommit'
import { SquashAlgorithm } from '../../UseCase/SquashAlgorithm'
import { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import { CreateComment } from '../../UseCase/CreateComment'
import { CreateThread } from '../../UseCase/CreateThread'
import { LoadThreads } from '../../UseCase/LoadThreads'
import { WebsocketService } from '../../Services/Websockets/WebsocketService'
import { VerifyMessages } from '../../UseCase/VerifyMessages'
import { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { ImageProxyParams } from '../../Api/Types/ImageProxyParams'
import { MetricService } from '../../Services/Metrics/MetricService'
import { RecentDocumentsService } from '../../Services/recent-documents'
import { GetNode } from '../../UseCase/GetNode'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { PublicDocLoader } from '../../Services/DocumentLoader/PublicDocLoader'
import type { UnleashClient } from '@proton/unleash'
import { ApiEditComment } from '../../Api/Requests/ApiEditComment'
import { ApiAddCommentToThread } from '../../Api/Requests/ApiAddCommentToThread'
import { ApiCreateThread } from '../../Api/Requests/ApiCreateThread'
import { ApiGetThread } from '../../Api/Requests/ApiGetThread'
import { RouteExecutor } from '../../Api/RouteExecutor'
import { LoadLogger } from '../../LoadLogger/LoadLogger'
import { FetchDecryptedCommit } from '../../UseCase/FetchDecryptedCommit'
import { CacheService } from '../../Services/CacheService'
import { GetNodePermissions } from '../../UseCase/GetNodePermissions'
import { GetDocumentKeys } from '../../UseCase/GetDocumentKeys'
import { FetchMetaAndRawCommit } from '../../UseCase/FetchMetaAndRawCommit'
import { IndexedDatabase } from '../../Database/IndexedDB'
import type { DatabaseSchema } from '../../Database/Schema'
import { CURRENT_DB_VERSION, DATABASE_NAME, migrations } from '../../Database/Schema'

export class AppDependencies extends DependencyContainer {
  constructor(
    api: Api,
    imageProxyParams: ImageProxyParams | undefined,
    publicContextHeaders: HttpHeaders | undefined,
    compatWrapper: DriveCompatWrapper,
    appVersion: string,
    unleashClient: UnleashClient,
    syncedEditorState: SyncedEditorState,
  ) {
    super()

    this.bind(App_TYPES.Logger, () => {
      const logger = new Logger('proton-docs', DOCS_DEBUG_KEY)
      LoadLogger.initialize(logger)
      return logger
    })

    this.bind(App_TYPES.EventBus, () => {
      return new InternalEventBus()
    })

    this.bind(App_TYPES.Database, () => {
      return new IndexedDatabase<DatabaseSchema>(
        DATABASE_NAME,
        CURRENT_DB_VERSION,
        migrations,
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.CacheService, () => {
      if (compatWrapper.getCompatType() === 'public') {
        return undefined
      }

      const cacheConfig = compatWrapper.getUserCompat().getKeysForLocalStorageEncryption()
      if (!cacheConfig) {
        return undefined
      }

      return new CacheService(
        cacheConfig,
        this.get<IndexedDatabase<DatabaseSchema>>(App_TYPES.Database),
        this.get<EncryptionService<EncryptionContext.LocalStorage>>(App_TYPES.LocalStorageEncryptionService),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.MetricService, () => {
      return new MetricService(api, compatWrapper.getCompatType())
    })

    this.bind(App_TYPES.RealtimeEncryptionService, () => {
      return new EncryptionService(EncryptionContext.RealtimeMessage, compatWrapper)
    })

    this.bind(App_TYPES.CommentsEncryptionService, () => {
      return new EncryptionService(EncryptionContext.PersistentComment, compatWrapper)
    })

    this.bind(App_TYPES.LocalStorageEncryptionService, () => {
      return new EncryptionService(EncryptionContext.LocalStorage, compatWrapper)
    })

    this.bind(App_TYPES.EncryptComment, () => {
      return new EncryptComment(
        this.get<EncryptionService<EncryptionContext.PersistentComment>>(App_TYPES.CommentsEncryptionService),
      )
    })

    this.bind(App_TYPES.DecryptComment, () => {
      return new DecryptComment(
        this.get<EncryptionService<EncryptionContext.PersistentComment>>(App_TYPES.CommentsEncryptionService),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.RouteExecutor, () => {
      return new RouteExecutor(api)
    })

    this.bind(App_TYPES.DocsApi, () => {
      return new DocsApi(
        this.get<RouteExecutor>(App_TYPES.RouteExecutor),
        publicContextHeaders,
        imageProxyParams,
        this.get<ApiCreateThread>(App_TYPES.ApiCreateThread),
        this.get<ApiAddCommentToThread>(App_TYPES.ApiAddCommentToThread),
        this.get<ApiGetThread>(App_TYPES.ApiGetThread),
        this.get<ApiEditComment>(App_TYPES.ApiEditComment),
      )
    })

    this.bind(App_TYPES.ApiEditComment, () => {
      return new ApiEditComment(this.get<RouteExecutor>(App_TYPES.RouteExecutor), publicContextHeaders)
    })

    this.bind(App_TYPES.ApiAddCommentToThread, () => {
      return new ApiAddCommentToThread(this.get<RouteExecutor>(App_TYPES.RouteExecutor), publicContextHeaders)
    })

    this.bind(App_TYPES.ApiCreateThread, () => {
      return new ApiCreateThread(this.get<RouteExecutor>(App_TYPES.RouteExecutor), publicContextHeaders)
    })

    this.bind(App_TYPES.ApiGetThread, () => {
      return new ApiGetThread(this.get<RouteExecutor>(App_TYPES.RouteExecutor), publicContextHeaders)
    })

    this.bind(App_TYPES.EncryptMessage, () => {
      return new EncryptMessage(
        this.get<EncryptionService<EncryptionContext.RealtimeMessage>>(App_TYPES.RealtimeEncryptionService),
      )
    })

    this.bind(App_TYPES.DecryptMessage, () => {
      return new DecryptMessage(
        this.get<EncryptionService<EncryptionContext.RealtimeMessage>>(App_TYPES.RealtimeEncryptionService),
      )
    })

    this.bind(App_TYPES.DecryptCommit, () => {
      return new DecryptCommit(this.get<DecryptMessage>(App_TYPES.DecryptMessage))
    })

    this.bind(App_TYPES.CreateEmptyDocumentForConversion, () => {
      return new CreateEmptyDocumentForConversion(
        compatWrapper.getUserCompat(),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
      )
    })

    this.bind(App_TYPES.SquashAlgorithm, () => {
      return new SquashAlgorithm(this.get<LoggerInterface>(App_TYPES.Logger))
    })

    this.bind(App_TYPES.SquashDocument, () => {
      return new SquashDocument(
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
        this.get<DecryptCommit>(App_TYPES.DecryptCommit),
        this.get<VerifyCommit>(App_TYPES.VerifyCommit),
        this.get<SquashAlgorithm>(App_TYPES.SquashAlgorithm),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.GetCommitData, () => {
      return new GetCommitData(this.get<DocsApi>(App_TYPES.DocsApi), this.get<CacheService>(App_TYPES.CacheService))
    })

    this.bind(App_TYPES.VerifyCommit, () => {
      return new VerifyCommit(this.get<VerifyMessages>(App_TYPES.VerifyMessages))
    })

    this.bind(App_TYPES.VerifyMessages, () => {
      return new VerifyMessages(
        this.get<EncryptionService<EncryptionContext.RealtimeMessage>>(App_TYPES.RealtimeEncryptionService),
      )
    })

    this.bind(App_TYPES.GetNodePermissions, () => {
      return new GetNodePermissions(
        compatWrapper,
        this.get<CacheService>(App_TYPES.CacheService),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.GetDocumentKeys, () => {
      return new GetDocumentKeys(
        compatWrapper,
        this.get<CacheService>(App_TYPES.CacheService),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.FetchMetaAndRawCommit, () => {
      return new FetchMetaAndRawCommit(
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<GetCommitData>(App_TYPES.GetCommitData),
        this.get<FetchRealtimeToken>(App_TYPES.FetchRealtimeToken),
      )
    })

    this.bind(App_TYPES.LoadDocument, () => {
      return new LoadDocument(
        compatWrapper,
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<GetNode>(App_TYPES.GetNode),
        this.get<DecryptCommit>(App_TYPES.DecryptCommit),
        this.get<GetNodePermissions>(App_TYPES.GetNodePermissions),
        this.get<FetchMetaAndRawCommit>(App_TYPES.FetchMetaAndRawCommit),
        this.get<GetDocumentKeys>(App_TYPES.GetDocumentKeys),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.GetNode, () => {
      return new GetNode(
        compatWrapper,
        this.get<CacheService>(App_TYPES.CacheService),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.LoadCommit, () => {
      return new FetchDecryptedCommit(
        this.get<GetCommitData>(App_TYPES.GetCommitData),
        this.get<DecryptCommit>(App_TYPES.DecryptCommit),
      )
    })

    this.bind(App_TYPES.GetDocumentMeta, () => {
      return new GetDocumentMeta(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.DuplicateDocument, () => {
      return new DuplicateDocument(
        compatWrapper.getUserCompat(),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<SeedInitialCommit>(App_TYPES.CreateInitialCommit),
      )
    })

    this.bind(App_TYPES.CreateInitialCommit, () => {
      return new SeedInitialCommit(
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
      )
    })

    this.bind(App_TYPES.CreateNewDocument, () => {
      return new CreateNewDocument(compatWrapper.getUserCompat(), this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta))
    })

    this.bind(App_TYPES.FetchRealtimeToken, () => {
      return new FetchRealtimeToken(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.ExportAndDownload, () => {
      return new ExportAndDownload()
    })

    this.bind(App_TYPES.PublicDocLoader, () => {
      return new PublicDocLoader(
        compatWrapper.getPublicCompat(),
        this.get<WebsocketService>(App_TYPES.WebsocketService),
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<LoadDocument>(App_TYPES.LoadDocument),
        this.get<ExportAndDownload>(App_TYPES.ExportAndDownload),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<FetchDecryptedCommit>(App_TYPES.LoadCommit),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<LoggerInterface>(App_TYPES.Logger),
        unleashClient,
        syncedEditorState,
        this.get<EncryptComment>(App_TYPES.EncryptComment),
        this.get<CreateComment>(App_TYPES.CreateComment),
        this.get<CreateThread>(App_TYPES.CreateThread),
        this.get<LoadThreads>(App_TYPES.LoadThreads),
        this.get<HandleRealtimeCommentsEvent>(App_TYPES.HandleRealtimeCommentsEvent),
        this.get<MetricService>(App_TYPES.MetricService),
        this.get<GetNode>(App_TYPES.GetNode),
      )
    })

    this.bind(App_TYPES.DocLoader, () => {
      return new DocLoader(
        this.get<WebsocketService>(App_TYPES.WebsocketService),
        compatWrapper.getUserCompat(),
        this.get<MetricService>(App_TYPES.MetricService),
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<SquashDocument>(App_TYPES.SquashDocument),
        this.get<SeedInitialCommit>(App_TYPES.CreateInitialCommit),
        this.get<LoadDocument>(App_TYPES.LoadDocument),
        this.get<FetchDecryptedCommit>(App_TYPES.LoadCommit),
        this.get<EncryptComment>(App_TYPES.EncryptComment),
        this.get<CreateComment>(App_TYPES.CreateComment),
        this.get<CreateThread>(App_TYPES.CreateThread),
        this.get<LoadThreads>(App_TYPES.LoadThreads),
        this.get<HandleRealtimeCommentsEvent>(App_TYPES.HandleRealtimeCommentsEvent),
        this.get<DuplicateDocument>(App_TYPES.DuplicateDocument),
        this.get<CreateNewDocument>(App_TYPES.CreateNewDocument),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<ExportAndDownload>(App_TYPES.ExportAndDownload),
        this.get<GetNode>(App_TYPES.GetNode),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<LoggerInterface>(App_TYPES.Logger),
        unleashClient,
      )
    })

    this.bind(App_TYPES.WebsocketService, () => {
      return new WebsocketService(
        this.get<FetchRealtimeToken>(App_TYPES.FetchRealtimeToken),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
        this.get<DecryptMessage>(App_TYPES.DecryptMessage),
        this.get<LoggerInterface>(App_TYPES.Logger),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<MetricService>(App_TYPES.MetricService),
        appVersion,
        unleashClient,
      )
    })

    this.bind(App_TYPES.CreateComment, () => {
      return new CreateComment(this.get<DocsApi>(App_TYPES.DocsApi), this.get<EncryptComment>(App_TYPES.EncryptComment))
    })

    this.bind(App_TYPES.CreateThread, () => {
      return new CreateThread(
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<EncryptComment>(App_TYPES.EncryptComment),
        this.get<DecryptComment>(App_TYPES.DecryptComment),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.LoadThreads, () => {
      return new LoadThreads(
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<DecryptComment>(App_TYPES.DecryptComment),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.HandleRealtimeCommentsEvent, () => {
      return new HandleRealtimeCommentsEvent()
    })

    this.bind(App_TYPES.RecentDocumentsService, () => {
      return new RecentDocumentsService(
        compatWrapper.getUserCompat(),
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<CacheService>(App_TYPES.CacheService),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })
  }
}
