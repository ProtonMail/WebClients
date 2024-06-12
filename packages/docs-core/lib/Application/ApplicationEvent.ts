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
}

export function PostApplicationError(eventBus: InternalEventBusInterface, params: { translatedError: string }): void {
  const payload: GeneralUserDisplayableErrorOccurredPayload = {
    translatedError: params.translatedError,
  }
  eventBus.publish({
    type: ApplicationEvent.GeneralUserDisplayableErrorOccurred,
    payload,
  })
}
