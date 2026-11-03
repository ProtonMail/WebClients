import type { SignDetachedRealtimeUpdate } from '@proton-docs/realtime-sdk'
import { CryptoProxy } from '@protontech/crypto'

export const signRealtimeDocumentUpdate: SignDetachedRealtimeUpdate = ({ plaintext, signatureContext, signingKey }) =>
  CryptoProxy.signMessage({
    binaryData: plaintext,
    signingKeys: signingKey,
    signatureContext: { value: signatureContext, critical: true },
    detached: true,
    format: 'binary',
  })
