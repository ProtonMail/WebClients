export type CommentVerificationResult =
  | {
      verified: true
    }
  | {
      verified: false
      /**
       * In cases of public viewers, the API to retrieve a public key for a user may not be available so comments
       * cannot be verified
       */
      verificationAvailable: boolean
    }
