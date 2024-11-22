import type { LoggerInterface } from '@proton/utils/logs'
import { Logger } from '@proton/utils/logs'
import { DOCS_DEBUG_KEY, DependencyContainer } from '@proton/docs-shared'
import { App_TYPES } from './Types'
import type { HttpHeaders } from '../../Api/DocsApi'
import { DocsApi } from '../../Api/DocsApi'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { DocLoader } from '../../Services/DocumentLoader/DocLoader'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import { InternalEventBus } from '@proton/docs-shared'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { Api } from '@proton/shared/lib/interfaces'
import { EncryptionService } from '../../Services/Encryption/EncryptionService'
import { EncryptComment } from '../../UseCase/EncryptComment'
import { DecryptComment } from '../../UseCase/DecryptComment'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { CreateEmptyDocumentForConversion } from '../../UseCase/CreateEmptyDocumentForConversion'
import { GetRealtimeUrlAndToken } from '../../UseCase/CreateRealtimeValetToken'
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
import { LoadCommit } from '../../UseCase/LoadCommit'
import { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { ImageProxyParams } from '../../Api/Types/ImageProxyParams'
import { MetricService } from '../../Services/Metrics/MetricService'
import { RecentDocumentsService } from '../../Services/RecentDocuments/RecentDocumentsService'
import { GetNode } from '../../UseCase/GetNode'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import { PublicDocLoader } from '../../Services/DocumentLoader/PublicDocLoader'
import type { UnleashClient } from '@proton/unleash'
import type { DocumentPropertiesStateInterface } from '../../Services/State/DocumentPropertiesStateInterface'

export class AppDependencies extends DependencyContainer {
  constructor(
    api: Api,
    imageProxyParams: ImageProxyParams | undefined,
    publicContextHeaders: HttpHeaders | undefined,
    compatWrapper: DriveCompatWrapper,
    sharedState: DocumentPropertiesStateInterface,
    appVersion: string,
    _unleashClient: UnleashClient,
  ) {
    super()

    this.bind(App_TYPES.Logger, () => {
      return new Logger('proton-docs', DOCS_DEBUG_KEY)
    })

    this.bind(App_TYPES.EventBus, () => {
      return new InternalEventBus()
    })

    this.bind(App_TYPES.MetricService, () => {
      return new MetricService(api)
    })

    this.bind(App_TYPES.RealtimeEncryptionService, () => {
      return new EncryptionService(EncryptionContext.RealtimeMessage, compatWrapper)
    })

    this.bind(App_TYPES.CommentsEncryptionService, () => {
      return new EncryptionService(EncryptionContext.PersistentComment, compatWrapper)
    })

    this.bind(App_TYPES.EncryptComment, () => {
      return new EncryptComment(
        this.get<EncryptionService<EncryptionContext.PersistentComment>>(App_TYPES.CommentsEncryptionService),
      )
    })

    this.bind(App_TYPES.DecryptComment, () => {
      return new DecryptComment(
        this.get<EncryptionService<EncryptionContext.PersistentComment>>(App_TYPES.CommentsEncryptionService),
      )
    })

    this.bind(App_TYPES.DocsApi, () => {
      return new DocsApi(api, publicContextHeaders, imageProxyParams)
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
      if (!compatWrapper.userCompat) {
        throw new Error('User compat not available')
      }
      return new CreateEmptyDocumentForConversion(
        compatWrapper.userCompat,
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
      return new GetCommitData(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.VerifyCommit, () => {
      return new VerifyCommit(this.get<VerifyMessages>(App_TYPES.VerifyMessages))
    })

    this.bind(App_TYPES.VerifyMessages, () => {
      return new VerifyMessages(
        this.get<EncryptionService<EncryptionContext.RealtimeMessage>>(App_TYPES.RealtimeEncryptionService),
      )
    })

    this.bind(App_TYPES.LoadDocument, () => {
      return new LoadDocument(
        compatWrapper,
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<GetNode>(App_TYPES.GetNode),
      )
    })

    this.bind(App_TYPES.GetNode, () => {
      return new GetNode(compatWrapper)
    })

    this.bind(App_TYPES.LoadCommit, () => {
      return new LoadCommit(
        this.get<GetCommitData>(App_TYPES.GetCommitData),
        this.get<DecryptCommit>(App_TYPES.DecryptCommit),
      )
    })

    this.bind(App_TYPES.GetDocumentMeta, () => {
      return new GetDocumentMeta(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.DuplicateDocument, () => {
      if (!compatWrapper.userCompat) {
        throw new Error('User compat not available')
      }
      return new DuplicateDocument(
        compatWrapper.userCompat,
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
      if (!compatWrapper.userCompat) {
        throw new Error('User compat not available')
      }
      return new CreateNewDocument(compatWrapper.userCompat, this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta))
    })

    this.bind(App_TYPES.CreateRealtimeValetToken, () => {
      return new GetRealtimeUrlAndToken(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.ExportAndDownload, () => {
      return new ExportAndDownload()
    })

    this.bind(App_TYPES.PublicDocLoader, () => {
      if (!compatWrapper.publicCompat) {
        throw new Error('Public compat not available')
      }

      return new PublicDocLoader(
        compatWrapper.publicCompat,
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<LoadDocument>(App_TYPES.LoadDocument),
        this.get<LoadCommit>(App_TYPES.LoadCommit),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<ExportAndDownload>(App_TYPES.ExportAndDownload),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.DocLoader, () => {
      if (!compatWrapper.userCompat) {
        throw new Error('User compat not available')
      }
      return new DocLoader(
        this.get<WebsocketService>(App_TYPES.WebsocketService),
        compatWrapper.userCompat,
        this.get<MetricService>(App_TYPES.MetricService),
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<SquashDocument>(App_TYPES.SquashDocument),
        this.get<SeedInitialCommit>(App_TYPES.CreateInitialCommit),
        this.get<LoadDocument>(App_TYPES.LoadDocument),
        this.get<LoadCommit>(App_TYPES.LoadCommit),
        this.get<EncryptComment>(App_TYPES.EncryptComment),
        this.get<CreateComment>(App_TYPES.CreateComment),
        this.get<CreateThread>(App_TYPES.CreateThread),
        this.get<LoadThreads>(App_TYPES.LoadThreads),
        this.get<HandleRealtimeCommentsEvent>(App_TYPES.HandleRealtimeCommentsEvent),
        this.get<DuplicateDocument>(App_TYPES.DuplicateDocument),
        this.get<CreateNewDocument>(App_TYPES.CreateNewDocument),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<GetNode>(App_TYPES.GetNode),
        this.get<ExportAndDownload>(App_TYPES.ExportAndDownload),
        sharedState,
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.WebsocketService, () => {
      return new WebsocketService(
        this.get<GetRealtimeUrlAndToken>(App_TYPES.CreateRealtimeValetToken),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
        this.get<DecryptMessage>(App_TYPES.DecryptMessage),
        this.get<LoggerInterface>(App_TYPES.Logger),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<MetricService>(App_TYPES.MetricService),
        sharedState,
        appVersion,
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
      if (!compatWrapper.userCompat) {
        throw new Error('User compat not available')
      }
      return new RecentDocumentsService(
        this.get<InternalEventBus>(App_TYPES.EventBus),
        compatWrapper.userCompat,
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })
  }
}
