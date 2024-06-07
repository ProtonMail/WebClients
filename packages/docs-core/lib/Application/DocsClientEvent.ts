import { SquashVerificationObjectionDecision } from '../Types/SquashVerificationObjection'

export enum DocsClientEvent {
  SquashVerificationObjectionDecisionMade = 'SquashVerificationObjectionDecisionMade',
}

export type DocsClientSquashVerificationObjectionMadePayload = {
  decision: SquashVerificationObjectionDecision
}
