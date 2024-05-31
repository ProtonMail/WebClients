import { DependencyContainer, Logger, LoggerInterface } from '@standardnotes/utils'
import { App_TYPES } from './Types'
import { DocsApi } from '../../Api/Docs/DocsApi'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { DocLoader } from '../../Services/DocumentLoader/DocLoader'
import { UserService } from '../../Services/User/UserService'
import { InternalEventBus, InternalEventBusInterface } from '@proton/docs-shared'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { Api, UserModel } from '@proton/shared/lib/interfaces'
import { CommentsApi } from '../../Api/Comments/CommentsApi'
import { EncryptionService } from '../../Services/Encryption/EncryptionService'
import { EncryptComment } from '../../UseCase/EncryptComment'
import { DecryptComment } from '../../UseCase/DecryptComment'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { CreateEmptyDocumentForConversion } from '../../UseCase/CreateEmptyDocumentForConversion'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { GetCommitData } from '../../UseCase/GetCommitData'
import { DebugSendCommitCommandToRTS } from '../../UseCase/SendCommitCommandToRTS'
import { DebugCreateInitialCommit } from '../../UseCase/CreateInitialCommit'
import { GenerateManifestSignature } from '../../UseCase/GenerateManifestSignature'
import { EncryptionContext } from '../../Services/Encryption/EncryptionContext'
import { VerifyCommit } from '../../UseCase/VerifyCommit'
import { DecryptCommit } from '../../UseCase/DecryptCommit'
import { DriveCompat } from '@proton/drive-store'
import { SquashAlgorithm } from '../../UseCase/SquashAlgorithm'
import { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import { CreateComment } from '../../UseCase/CreateComment'
import { CreateThread } from '../../UseCase/CreateThread'
import { LoadThreads } from '../../UseCase/LoadThreads'
import { WebsocketService } from '../../Services/Websockets/WebsocketService'

export class AppDependencies extends DependencyContainer {
  constructor(api: Api, user: UserModel, driveCompat: DriveCompat) {
    super()

    this.bind(App_TYPES.Logger, () => {
      return new Logger('proton-docs')
    })

    this.bind(App_TYPES.EventBus, () => {
      return new InternalEventBus()
    })

    this.bind(App_TYPES.RealtimeEncryptionService, () => {
      return new EncryptionService(EncryptionContext.RealtimeMessage, driveCompat)
    })

    this.bind(App_TYPES.CommentsEncryptionService, () => {
      return new EncryptionService(EncryptionContext.PersistentComment, driveCompat)
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

    this.bind(App_TYPES.SendCommitCommandToRTS, () => {
      return new DebugSendCommitCommandToRTS()
    })

    this.bind(App_TYPES.DocsApi, () => {
      return new DocsApi(api)
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
      return new DecryptCommit(
        this.get<DecryptMessage>(App_TYPES.DecryptMessage),
        this.get<VerifyCommit>(App_TYPES.VerifyCommit),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
      )
    })

    this.bind(App_TYPES.CreateEmptyDocumentForConversion, () => {
      return new CreateEmptyDocumentForConversion(driveCompat, this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta))
    })

    this.bind(App_TYPES.SquashAlgorithm, () => {
      return new SquashAlgorithm()
    })

    this.bind(App_TYPES.SquashDocument, () => {
      return new SquashDocument(
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
        this.get<DecryptCommit>(App_TYPES.DecryptCommit),
        this.get<GenerateManifestSignature>(App_TYPES.GenerateManifestSignature),
        this.get<SquashAlgorithm>(App_TYPES.SquashAlgorithm),
      )
    })

    this.bind(App_TYPES.GenerateManifestSignature, () => {
      return new GenerateManifestSignature(driveCompat)
    })

    this.bind(App_TYPES.GetCommitData, () => {
      return new GetCommitData(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.VerifyCommit, () => {
      return new VerifyCommit(
        this.get<EncryptionService<EncryptionContext.RealtimeMessage>>(App_TYPES.RealtimeEncryptionService),
      )
    })

    this.bind(App_TYPES.LoadDocument, () => {
      return new LoadDocument(
        driveCompat,
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<GetCommitData>(App_TYPES.GetCommitData),
        this.get<DecryptCommit>(App_TYPES.DecryptCommit),
      )
    })

    this.bind(App_TYPES.GetDocumentMeta, () => {
      return new GetDocumentMeta(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.DuplicateDocument, () => {
      return new DuplicateDocument(
        driveCompat,
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<DebugCreateInitialCommit>(App_TYPES.SquashDocument),
      )
    })

    this.bind(App_TYPES.CreateInitialCommit, () => {
      return new DebugCreateInitialCommit(
        this.get<DocsApi>(App_TYPES.DocsApi),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
      )
    })

    this.bind(App_TYPES.CreateNewDocument, () => {
      return new CreateNewDocument(driveCompat, this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta))
    })

    this.bind(App_TYPES.CreateRealtimeValetToken, () => {
      return new GetRealtimeUrlAndToken(this.get<DocsApi>(App_TYPES.DocsApi))
    })

    this.bind(App_TYPES.DocLoader, () => {
      return new DocLoader(
        this.get<UserService>(App_TYPES.UserService),
        this.get<WebsocketService>(App_TYPES.WebsocketService),
        driveCompat,
        this.get<CommentsApi>(App_TYPES.CommentsApi),
        this.get<SquashDocument>(App_TYPES.SquashDocument),
        this.get<DebugCreateInitialCommit>(App_TYPES.CreateInitialCommit),
        this.get<LoadDocument>(App_TYPES.LoadDocument),
        this.get<DecryptMessage>(App_TYPES.DecryptMessage),
        this.get<EncryptComment>(App_TYPES.EncryptComment),
        this.get<CreateComment>(App_TYPES.CreateComment),
        this.get<CreateThread>(App_TYPES.CreateThread),
        this.get<LoadThreads>(App_TYPES.LoadThreads),
        this.get<HandleRealtimeCommentsEvent>(App_TYPES.HandleRealtimeCommentsEvent),
        this.get<DuplicateDocument>(App_TYPES.DuplicateDocument),
        this.get<CreateNewDocument>(App_TYPES.CreateNewDocument),
        this.get<GetDocumentMeta>(App_TYPES.GetDocumentMeta),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
        this.get<LoggerInterface>(App_TYPES.Logger),
      )
    })

    this.bind(App_TYPES.WebsocketService, () => {
      return new WebsocketService(
        this.get<GetRealtimeUrlAndToken>(App_TYPES.CreateRealtimeValetToken),
        this.get<EncryptMessage>(App_TYPES.EncryptMessage),
        this.get<DebugSendCommitCommandToRTS>(App_TYPES.SendCommitCommandToRTS),
        this.get<LoggerInterface>(App_TYPES.Logger),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
      )
    })

    this.bind(App_TYPES.UserService, () => {
      return new UserService(user)
    })

    this.bind(App_TYPES.CommentsApi, () => {
      return new CommentsApi(api)
    })

    this.bind(App_TYPES.CreateComment, () => {
      return new CreateComment(
        this.get<CommentsApi>(App_TYPES.CommentsApi),
        this.get<EncryptComment>(App_TYPES.EncryptComment),
      )
    })

    this.bind(App_TYPES.CreateThread, () => {
      return new CreateThread(
        this.get<CommentsApi>(App_TYPES.CommentsApi),
        this.get<EncryptComment>(App_TYPES.EncryptComment),
        this.get<DecryptComment>(App_TYPES.DecryptComment),
        this.get<InternalEventBusInterface>(App_TYPES.EventBus),
      )
    })

    this.bind(App_TYPES.LoadThreads, () => {
      return new LoadThreads(
        this.get<CommentsApi>(App_TYPES.CommentsApi),
        this.get<DecryptComment>(App_TYPES.DecryptComment),
      )
    })

    this.bind(App_TYPES.HandleRealtimeCommentsEvent, () => {
      return new HandleRealtimeCommentsEvent()
    })
  }
}
