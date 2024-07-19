import type { Api } from '@proton/shared/lib/interfaces'
import { App_TYPES } from './Dependencies/Types'
import { AppDependencies } from './Dependencies/AppDependencies'
import type { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import type { DocLoader } from '../Services/DocumentLoader/DocLoader'
import type { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import type { ApplicationInterface } from './ApplicationInterface'
import type { WebsocketServiceInterface } from '../Services/Websockets/WebsocketServiceInterface'
import type { LoggerInterface } from '@proton/utils/logs'
import type { ImageProxyParams } from '../Api/Types/ImageProxyParams'

export class Application implements ApplicationInterface {
  private readonly deps = new AppDependencies(this.protonApi, this.imageProxyParams, this.driveCompat)

  constructor(
    private protonApi: Api,
    private imageProxyParams: ImageProxyParams,
    private driveCompat: DriveCompat,
  ) {}

  public get eventBus(): InternalEventBusInterface {
    return this.deps.get<InternalEventBusInterface>(App_TYPES.EventBus)
  }

  public get logger(): LoggerInterface {
    return this.deps.get<LoggerInterface>(App_TYPES.Logger)
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
