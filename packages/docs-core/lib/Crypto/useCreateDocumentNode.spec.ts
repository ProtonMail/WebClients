import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import { generateNodeUid, getDrive } from '@proton/drive/sdk'
import { ADDRESS_STATUS } from '@proton/shared/lib/constants'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import { renderHook } from '@testing-library/react'
import {
  encryptName,
  generateContentKeys,
  generateLookupHash,
  generateNodeKeys,
  sign,
} from '@proton/shared/lib/keys/driveKeys'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'
import { useCreateDocumentNode } from './useCreateDocumentNode'
import { useGetVerificationKey } from './useGetVerificationKey'

jest.mock('@proton/account/addresses/hooks')
jest.mock('@proton/account/addressKeys/hooks')
jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))
jest.mock('@protontech/crypto', () => ({
  VERIFICATION_STATUS: jest.requireActual('@protontech/crypto').VERIFICATION_STATUS,
  CryptoProxy: { importPrivateKey: jest.fn(), decryptMessage: jest.fn() },
}))
jest.mock('@proton/shared/lib/keys/driveKeys')
jest.mock('../DriveSDK/traceErrorSDK')
// Factory avoids loading @proton/components, which needs browser APIs
jest.mock('./useGetVerificationKey', () => ({ useGetVerificationKey: jest.fn() }))

const volumeId = 'volume'
const parentMeta = { volumeId, linkId: 'parent' }

const rootLink = {
  Link: {
    LinkID: 'root',
    NodeKey: 'root-key',
    NodePassphrase: 'root-passphrase',
    NodePassphraseSignature: 'root-signature',
    SignatureEmail: null,
  },
  Folder: {},
}
const parentLink = {
  Link: {
    LinkID: 'parent',
    NodeKey: 'parent-key',
    NodePassphrase: 'parent-passphrase',
    NodePassphraseSignature: 'parent-signature',
    SignatureEmail: 'author@pm.me',
  },
  Folder: { NodeHashKey: 'parent-hash-key' },
}

describe('useCreateDocumentNode', () => {
  let api: jest.Mock
  let links: unknown[]
  let share: { AddressID: string; Key: string; Passphrase: string; PassphraseSignature: string; Creator: string }
  let verificationStatus: VERIFICATION_STATUS

  beforeEach(() => {
    jest.clearAllMocks()
    links = [parentLink, rootLink]
    share = {
      AddressID: 'address-id',
      Key: 'share-key',
      Passphrase: 'share-passphrase',
      PassphraseSignature: 'share-signature',
      Creator: 'creator@pm.me',
    }
    verificationStatus = VERIFICATION_STATUS.SIGNED_AND_VALID
    api = jest.fn(async ({ url }: { url: string }) => {
      if (url === 'drive/shares/share-id') {
        return share
      }
      if (url === `drive/v2/volumes/${volumeId}/links`) {
        return { Links: links }
      }
      return { Document: { LinkID: 'new-document' } }
    })

    jest
      .mocked(useGetAddresses)
      .mockReturnValue(
        jest.fn().mockResolvedValue([{ ID: 'address-id', Email: 'me@pm.me', Status: ADDRESS_STATUS.STATUS_ENABLED }]),
      )
    jest.mocked(useGetAddressKeys).mockReturnValue(jest.fn().mockResolvedValue([{ privateKey: 'address-key' }]))
    jest.mocked(getDrive).mockReturnValue({
      getNodeHierarchy: jest
        .fn()
        .mockResolvedValue([
          { uid: generateNodeUid(volumeId, 'root'), deprecatedShareId: 'share-id' },
          { uid: generateNodeUid(volumeId, 'parent') },
        ]),
    } as any)

    jest
      .mocked(useGetVerificationKey)
      .mockReturnValue(jest.fn(async (email?: string) => [`${email}-public-key`]) as any)

    // Each key is "unlocked" by wrapping its name, so the unlock chain is visible in the result
    jest
      .mocked(CryptoProxy.decryptMessage)
      .mockImplementation((async ({ armoredMessage, decryptionKeys }: any) =>
        armoredMessage === 'parent-hash-key'
          ? { data: 'parent-hash' }
          : { data: `${armoredMessage}|${decryptionKeys}`, verificationStatus }) as any)
    jest
      .mocked(CryptoProxy.importPrivateKey)
      .mockImplementation(async ({ armoredKey, passphrase }: any) => `${armoredKey}(${passphrase})` as any)
    jest.mocked(generateLookupHash).mockResolvedValue('hash')
    jest.mocked(generateNodeKeys).mockResolvedValue({
      NodeKey: 'node-key',
      NodePassphrase: 'node-passphrase',
      NodePassphraseSignature: 'node-passphrase-signature',
      privateKey: 'node-private-key',
    } as any)
    jest.mocked(encryptName).mockResolvedValue('encrypted-name')
    jest.mocked(generateContentKeys).mockResolvedValue({
      sessionKey: 'session-key',
      ContentKeyPacket: 'content-key-packet',
      ContentKeyPacketSignature: 'content-key-packet-signature',
    } as any)
    jest.mocked(sign).mockResolvedValue('manifest-signature')
  })

  const createDocumentNode = (documentType: 'doc' | 'sheet' = 'doc') =>
    renderHook(() => useCreateDocumentNode(api as unknown as Api)).result.current(parentMeta, 'name', documentType)

  it('unlocks parent key from the root share down, regardless of API link order', async () => {
    await createDocumentNode()

    const shareKey = 'share-key(share-passphrase|address-key)'
    const rootKey = `root-key(root-passphrase|${shareKey})`
    const parentKey = `parent-key(parent-passphrase|${rootKey})`
    expect(generateNodeKeys).toHaveBeenCalledWith(parentKey, 'address-key')
    expect(encryptName).toHaveBeenCalledWith('name', parentKey, 'address-key')
    expect(CryptoProxy.decryptMessage).toHaveBeenCalledWith(
      expect.objectContaining({ armoredMessage: 'parent-hash-key', decryptionKeys: parentKey }),
    )
    expect(generateLookupHash).toHaveBeenCalledWith('name', 'parent-hash')
  })

  it('creates document and returns its meta and keys', async () => {
    const result = await createDocumentNode()

    expect(api).toHaveBeenCalledWith({
      method: 'post',
      url: `drive/v2/volumes/${volumeId}/documents`,
      data: {
        ParentLinkID: 'parent',
        NodeKey: 'node-key',
        NodePassphrase: 'node-passphrase',
        NodePassphraseSignature: 'node-passphrase-signature',
        SignatureAddress: 'me@pm.me',
        Name: 'encrypted-name',
        Hash: 'hash',
        ContentKeyPacket: 'content-key-packet',
        ContentKeyPacketSignature: 'content-key-packet-signature',
        ManifestSignature: 'manifest-signature',
        DocumentType: 1,
      },
    })
    expect(result).toEqual({
      volumeId,
      linkId: 'new-document',
      keys: { documentContentKey: 'session-key', userAddressPrivateKey: 'address-key', userOwnAddress: 'me@pm.me' },
    })
  })

  it('maps sheet to document type 2', async () => {
    await createDocumentNode('sheet')

    expect(api).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ DocumentType: 2 }) }))
  })

  it('fails when share has no address', async () => {
    share.AddressID = ''

    await expect(createDocumentNode()).rejects.toThrow('Loading share without direct access is not supported')
  })

  it('signs with the first address key and unlocks share with all of them', async () => {
    jest
      .mocked(useGetAddressKeys)
      .mockReturnValue(jest.fn().mockResolvedValue([{ privateKey: 'primary-key' }, { privateKey: 'other-key' }]))

    await createDocumentNode()

    expect(CryptoProxy.decryptMessage).toHaveBeenCalledWith(
      expect.objectContaining({ armoredMessage: 'share-passphrase', decryptionKeys: ['primary-key', 'other-key'] }),
    )
    expect(generateNodeKeys).toHaveBeenCalledWith(expect.anything(), 'primary-key')
    expect(sign).toHaveBeenCalledWith(expect.anything(), 'primary-key')
  })

  it('verifies share with creator keys and anonymous links with parent key, skipping the hierarchy root', async () => {
    links = [{ ...parentLink, Link: { ...parentLink.Link, SignatureEmail: null } }, rootLink]

    await createDocumentNode()

    const shareKey = 'share-key(share-passphrase|address-key)'
    const rootKey = `root-key(root-passphrase|${shareKey})`
    expect(CryptoProxy.decryptMessage).toHaveBeenCalledWith({
      armoredMessage: 'share-passphrase',
      armoredSignature: 'share-signature',
      decryptionKeys: ['address-key'],
      verificationKeys: ['creator@pm.me-public-key'],
    })
    expect(CryptoProxy.decryptMessage).toHaveBeenCalledWith({
      armoredMessage: 'root-passphrase',
      armoredSignature: 'root-signature',
      decryptionKeys: shareKey,
      verificationKeys: [],
    })
    expect(CryptoProxy.decryptMessage).toHaveBeenCalledWith({
      armoredMessage: 'parent-passphrase',
      armoredSignature: 'parent-signature',
      decryptionKeys: rootKey,
      verificationKeys: [rootKey],
    })
  })

  it('verifies link with its signature email keys', async () => {
    await createDocumentNode()

    expect(CryptoProxy.decryptMessage).toHaveBeenCalledWith(
      expect.objectContaining({ armoredMessage: 'parent-passphrase', verificationKeys: ['author@pm.me-public-key'] }),
    )
  })

  it('reports failed verification without failing', async () => {
    verificationStatus = VERIFICATION_STATUS.SIGNED_AND_INVALID

    await expect(createDocumentNode()).resolves.toEqual(expect.objectContaining({ linkId: 'new-document' }))
    expect(traceErrorSDK).toHaveBeenCalledWith(
      new Error('Failed to verify key passphrase signature'),
      'DocsDriveCompatSDK',
    )
  })

  it('does not report unverified passphrase without verification keys', async () => {
    verificationStatus = VERIFICATION_STATUS.NOT_SIGNED
    jest.mocked(useGetVerificationKey).mockReturnValue(jest.fn().mockResolvedValue([]))

    await createDocumentNode()

    expect(traceErrorSDK).not.toHaveBeenCalled()
  })

  it('fails when root node has no share', async () => {
    jest.mocked(getDrive).mockReturnValue({
      getNodeHierarchy: jest.fn().mockResolvedValue([{ uid: generateNodeUid(volumeId, 'parent') }]),
    } as any)

    await expect(createDocumentNode()).rejects.toThrow('Root node has no share')
  })

  it('fails when share address is not own address', async () => {
    jest.mocked(useGetAddresses).mockReturnValue(jest.fn().mockResolvedValue([]))

    await expect(createDocumentNode()).rejects.toThrow('Address is not available')
  })

  it('fails when parent is not a folder', async () => {
    links = [{ ...parentLink, Folder: null }, rootLink]

    await expect(createDocumentNode()).rejects.toThrow('Creating documents in non-folders is not allowed')
  })

  it('traces errors', async () => {
    links = [rootLink]

    await expect(createDocumentNode()).rejects.toThrow('Link not found')
    expect(traceErrorSDK).toHaveBeenCalledWith(expect.any(Error), 'DocsDriveCompatSDK')
  })
})
