import type { CreateEmptyDocumentForConversion } from '../UseCase/CreateEmptyDocumentForConversion'
import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'
import type { LoggerInterface } from '@proton/shared/lib/logs'

export interface ApplicationInterface {
  createEmptyDocumentForConversionUseCase: CreateEmptyDocumentForConversion
  destroy(): void
  eventBus: InternalEventBusInterface
  get logger(): LoggerInterface
  isRunningInNativeMobileWeb: boolean
}
