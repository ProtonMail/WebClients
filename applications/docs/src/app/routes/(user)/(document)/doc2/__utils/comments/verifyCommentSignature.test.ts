import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@protontech/crypto'

import { createVerifyCommentSignature } from './verifyCommentSignature'

beforeAll(async () => {
  const { Api: CryptoApi } = await import('@protontech/crypto/proxy/endpoint/api.ts')
  CryptoApi.init({})
  CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore())
})

afterAll(() => CryptoProxy.releaseEndpoint())

const AUTHOR = 'author@example.com'
const CONTEXT = `docs.comment.${AUTHOR}.mark-1`
const plaintext = new TextEncoder().encode('A comment')

async function generateKey() {
  const privateKey = await CryptoProxy.generateKey({ userIDs: [{ email: AUTHOR }] })
  const publicKey = await CryptoProxy.importPublicKey({
    armoredKey: await CryptoProxy.exportPublicKey({ key: privateKey }),
  })
  return { privateKey, publicKey }
}

/** Signed as /doc signs a comment: detached, with its context critical */
function sign(signingKey: PrivateKeyReference, context = CONTEXT) {
  return CryptoProxy.signMessage({
    binaryData: plaintext,
    signingKeys: signingKey,
    signatureContext: { value: context, critical: true },
    detached: true,
    format: 'binary',
  })
}

function verify(
  signature: Uint8Array<ArrayBuffer>,
  getVerificationKey: (email: string) => Promise<PublicKeyReference[]>,
) {
  const logger = { error: vi.fn(), info: vi.fn() }
  const verifySignature = createVerifyCommentSignature(getVerificationKey, logger)
  return verifySignature({ plaintext, signature, signatureContext: CONTEXT, authorAddress: AUTHOR })
}

describe('createVerifyCommentSignature', () => {
  test("verifies a signature by the author's key, looked up by the author's address", async () => {
    const { privateKey, publicKey } = await generateKey()
    const getVerificationKey = vi.fn(async () => [publicKey])

    expect(await verify(await sign(privateKey), getVerificationKey)).toBe('verified')
    expect(getVerificationKey).toHaveBeenCalledWith(AUTHOR)
  })

  test('reads invalid for a signature with another context, by another key, or with no key found', async () => {
    const { privateKey, publicKey } = await generateKey()
    const other = await generateKey()

    expect(await verify(await sign(privateKey, `docs.comment.${AUTHOR}.mark-2`), async () => [publicKey])).toBe(
      'invalid',
    )
    expect(await verify(await sign(other.privateKey), async () => [publicKey])).toBe('invalid')
    expect(await verify(await sign(privateKey), async () => [])).toBe('invalid')
  })

  test('reads invalid when the key lookup fails, as /doc does', async () => {
    const { privateKey } = await generateKey()

    expect(
      await verify(await sign(privateKey), async () => {
        throw new Error('offline')
      }),
    ).toBe('invalid')
  })
})
