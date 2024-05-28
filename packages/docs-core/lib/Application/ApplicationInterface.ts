import { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import { InternalEventBusInterface } from '@proton/docs-shared'

export interface ApplicationInterface {
  eventBus: InternalEventBusInterface
  docLoader: DocLoaderInterface
  createEmptyDocumentForConversionUseCase: CreateEmptyDocumentForConversion
}
