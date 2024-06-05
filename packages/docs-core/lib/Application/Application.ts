import { Api, UserModel } from '@proton/shared/lib/interfaces'
import { App_TYPES } from './Dependencies/Types'
import { AppDependencies } from './Dependencies/AppDependencies'
import { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import { DocLoader } from '../Services/DocumentLoader/DocLoader'
import { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import { InternalEventBusInterface } from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import { ApplicationInterface } from './ApplicationInterface'
import { WebsocketServiceInterface } from '../Services/Websockets/WebsocketServiceInterface'

export class Application implements ApplicationInterface {
  private readonly deps = new AppDependencies(this.protonApi, this.user, this.driveCompat)

  constructor(
    private protonApi: Api,
    private user: UserModel,
    private driveCompat: DriveCompat,
  ) {}

  public get eventBus(): InternalEventBusInterface {
    return this.deps.get<InternalEventBusInterface>(App_TYPES.EventBus)
  }

  public get docLoader(): DocLoaderInterface {
    return this.deps.get<DocLoader>(App_TYPES.DocLoader)
  }

  public get createEmptyDocumentForConversionUseCase(): CreateEmptyDocumentForConversion {
    return this.deps.get<CreateEmptyDocumentForConversion>(App_TYPES.CreateEmptyDocumentForConversion)
  }

  public get websocketService(): WebsocketServiceInterface {
    return this.deps.get<WebsocketServiceInterface>(App_TYPES.WebsocketService)
  }
}
