import type { InternalEventBusInterface } from '@proton/docs-shared'
import type { SquashVerificationObjectionDecision } from '../Types/SquashVerificationObjection'

export enum ApplicationEvent {
  SquashVerificationObjectionDecisionMade = 'SquashVerificationObjectionDecisionMade',
  GeneralUserDisplayableErrorOccurred = 'GeneralUserDisplayableErrorOccurred',
  GenericInfo = 'GenericInfo',
}

export type GenericInfoEventPayload = {
  title: string
  translatedMessage: string
}

export type DocsClientSquashVerificationObjectionMadePayload = {
  decision: SquashVerificationObjectionDecision
}

export type GeneralUserDisplayableErrorOccurredPayload = {
  translatedError: string
  translatedErrorTitle?: string
  /** If true, the UI will be destroyed and only this error will be shown */
  irrecoverable?: boolean
  onClose?: () => void
}

export function PostApplicationError(
  eventBus: InternalEventBusInterface,
  params: GeneralUserDisplayableErrorOccurredPayload,
): void {
  eventBus.publish({
    type: ApplicationEvent.GeneralUserDisplayableErrorOccurred,
    payload: params,
  })
}
