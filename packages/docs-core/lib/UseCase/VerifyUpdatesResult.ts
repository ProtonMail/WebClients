import type { DecryptedMessage } from '@proton/docs-shared/Realtime/DecryptedMessage'

export type SingleMessageVerificationResult = {
  verified: boolean
  message: DecryptedMessage
}

export type VerificationUsecaseResult = {
  allVerified: boolean
  messages: SingleMessageVerificationResult[]
}
