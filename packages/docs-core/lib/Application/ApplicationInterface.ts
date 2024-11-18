import type { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import type { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'
import type { DocControllerInterface } from '../Controller/Document/DocControllerInterface'

export interface ApplicationInterface {
  createEmptyDocumentForConversionUseCase: CreateEmptyDocumentForConversion
  destroy(): void
  docLoader: DocLoaderInterface
  eventBus: InternalEventBusInterface
  get logger(): LoggerInterface
  isRunningInNativeMobileWeb: boolean
  privateDocController: DocControllerInterface
}
