import type { LoggerInterface } from '@proton/utils/logs'
import type { PublicNodeMeta } from '@proton/drive-store'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import type { AnyDocControllerInterface } from './AnyDocControllerInterface'
import type { PublicDocControllerInterface } from './PublicDocControllerInterface'

/**
 * Controls the lifecycle of a single public document.
 */
export class PublicDocController implements AnyDocControllerInterface, PublicDocControllerInterface {
  didAlreadyReceiveEditorReadyEvent = false
  isDestroyed = false

  constructor(
    readonly nodeMeta: PublicNodeMeta,
    readonly eventBus: InternalEventBusInterface,
    readonly logger: LoggerInterface,
  ) {}

  destroy(): void {
    this.isDestroyed = true
  }
}
