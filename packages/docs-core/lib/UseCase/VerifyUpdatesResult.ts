import { DecryptedMessage } from '@proton/docs-shared'

export type SingleMessageVerificationResult = {
  verified: boolean
  message: DecryptedMessage
}

export type VerificationUsecaseResult = {
  allVerified: boolean
  messages: SingleMessageVerificationResult[]
}
