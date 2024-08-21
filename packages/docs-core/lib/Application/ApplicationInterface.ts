import type { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import type { DocLoaderInterface } from '../Services/DocumentLoader/DocLoaderInterface'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'

export interface ApplicationInterface {
  eventBus: InternalEventBusInterface
  docLoader: DocLoaderInterface
  createEmptyDocumentForConversionUseCase: CreateEmptyDocumentForConversion
  get logger(): LoggerInterface
  destroy(): void
  isRunningInNativeMobileWeb: boolean
}
