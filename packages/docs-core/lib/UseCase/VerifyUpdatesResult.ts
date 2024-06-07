import { DecryptedMessage } from '../Models/DecryptedMessage'

export type SingleMessageVerificationResult = {
  verified: boolean
  message: DecryptedMessage
}

export type VerificationUsecaseResult = {
  allVerified: boolean
  messages: SingleMessageVerificationResult[]
}
