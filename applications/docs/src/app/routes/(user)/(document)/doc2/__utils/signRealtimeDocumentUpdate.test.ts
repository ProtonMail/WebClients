import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto'

import { signRealtimeDocumentUpdate } from './signRealtimeDocumentUpdate'

beforeAll(async () => {
  const { Api: CryptoApi } = await import('@protontech/crypto/proxy/endpoint/api.ts')
  CryptoApi.init({})
  CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore())
})

afterAll(() => CryptoProxy.releaseEndpoint())

async function signAndVerify(signingContext: string, verificationContext: string) {
  const signingKey = await CryptoProxy.generateKey({ userIDs: [{ email: 'member@example.com' }] })
  const publicKey = await CryptoProxy.importPublicKey({
    armoredKey: await CryptoProxy.exportPublicKey({ key: signingKey }),
  })
  const plaintext = new TextEncoder().encode('document update')

  const signature = await signRealtimeDocumentUpdate({ plaintext, signatureContext: signingContext, signingKey })

  const { verificationStatus } = await CryptoProxy.verifyMessage({
    binaryData: plaintext,
    binarySignature: signature,
    verificationKeys: publicKey,
    signatureContext: { value: verificationContext, required: true },
  })
  return verificationStatus
}

describe('signRealtimeDocumentUpdate', () => {
  test('produces a detached signature that verifies with the same context', async () => {
    expect(await signAndVerify('docs.rts.1.member@example.com.0', 'docs.rts.1.member@example.com.0')).toBe(
      VERIFICATION_STATUS.SIGNED_AND_VALID,
    )
  })

  test('produces a signature that does not verify with another context', async () => {
    expect(await signAndVerify('docs.rts.1.member@example.com.0', 'docs.rts.1.member@example.com.1')).toBe(
      VERIFICATION_STATUS.SIGNED_AND_INVALID,
    )
  })
})
