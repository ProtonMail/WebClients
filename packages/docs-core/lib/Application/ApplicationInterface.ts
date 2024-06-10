import { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import { InternalEventBusInterface } from '@proton/docs-shared'
import { LoggerInterface } from '@proton/utils/logs'

export interface ApplicationInterface {
  eventBus: InternalEventBusInterface
  docLoader: DocLoaderInterface
  createEmptyDocumentForConversionUseCase: CreateEmptyDocumentForConversion
  get logger(): LoggerInterface
}
