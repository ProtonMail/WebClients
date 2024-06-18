import { InternalEventBusInterface } from '@proton/docs-shared'
import { SquashVerificationObjectionDecision } from '../Types/SquashVerificationObjection'

export enum ApplicationEvent {
  SquashVerificationObjectionDecisionMade = 'SquashVerificationObjectionDecisionMade',
  GeneralUserDisplayableErrorOccurred = 'GeneralUserDisplayableErrorOccurred',
}

export type DocsClientSquashVerificationObjectionMadePayload = {
  decision: SquashVerificationObjectionDecision
}

export type GeneralUserDisplayableErrorOccurredPayload = {
  translatedError: string
  translatedErrorTitle?: string
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
