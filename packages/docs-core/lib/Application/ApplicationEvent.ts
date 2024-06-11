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
  error: string
}

export function PostApplicationError(eventBus: InternalEventBusInterface, error: string): void {
  const payload: GeneralUserDisplayableErrorOccurredPayload = {
    error,
  }
  eventBus.publish({
    type: ApplicationEvent.GeneralUserDisplayableErrorOccurred,
    payload,
  })
}
