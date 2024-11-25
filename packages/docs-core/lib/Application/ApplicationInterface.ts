import type { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'

export interface ApplicationInterface {
  createEmptyDocumentForConversionUseCase: CreateEmptyDocumentForConversion
  destroy(): void
  eventBus: InternalEventBusInterface
  get logger(): LoggerInterface
  isRunningInNativeMobileWeb: boolean
}
