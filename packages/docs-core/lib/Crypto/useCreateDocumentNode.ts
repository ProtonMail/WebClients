import { useCallback } from 'react'
import type { PrivateKeyReference, PublicKeyReference } from '@protontech/crypto'
import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto'
import { useGetAddresses } from '@proton/account/addresses/hooks'
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks'
import type { DocumentType, NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { DocumentKeys } from '@proton/docs-shared/CryptoTypes'
import { generateNodeUid, getDrive, type NodeEntity, splitNodeUid } from '@proton/drive/sdk'
import type { Api } from '@proton/shared/lib/interfaces/Api'
import {
  encryptName,
  generateContentKeys,
  generateLookupHash,
  generateNodeKeys,
  sign,
} from '@proton/shared/lib/keys/driveKeys'
import type { PrimaryAddressKeys } from '../DriveSDK/getDocumentKeys'
import { traceErrorSDK } from '../DriveSDK/traceErrorSDK'
import { getOwnAddressKeys, getRootShare } from './useGetMemberAddressKeys'
import { useGetVerificationKey } from './useGetVerificationKey'

export type CreateDocumentNode = (
  parentMeta: NodeMeta,
  name: string,
  documentType: DocumentType,
) => Promise<NodeMeta & { keys: DocumentKeys }>

type LinkDetails = {
  Link: {
    LinkID: string
    NodeKey: string
    NodePassphrase: string
    NodePassphraseSignature: string
    SignatureEmail?: string | null
  }
  Folder: { NodeHashKey?: string | null } | null
}

type GetAddressKeys = (addressId: string) => Promise<PrimaryAddressKeys>

type GetVerificationKeys = (email?: string) => Promise<PublicKeyReference[]>

// Parent keys are unlocked from the root share down, and the root share member address signs the document
export function useCreateDocumentNode(api: Api): CreateDocumentNode {
  const getAddresses = useGetAddresses()
  const getAddressKeys = useGetAddressKeys()
  const getVerificationKeys = useGetVerificationKey(api)

  return useCallback<CreateDocumentNode>(
    async (parentMeta, name, documentType) => {
      const getAddress: GetAddressKeys = (addressId) => getOwnAddressKeys(getAddresses, getAddressKeys, addressId)

      try {
        return await createDocumentNode(api, getAddress, getVerificationKeys, parentMeta, name, documentType)
      } catch (error) {
        traceErrorSDK(error, 'DocsDriveCompatSDK')
        throw error
      }
    },
    [api, getAddresses, getAddressKeys, getVerificationKeys],
  )
}

async function createDocumentNode(
  api: Api,
  getAddress: GetAddressKeys,
  getVerificationKeys: GetVerificationKeys,
  { volumeId, linkId: parentLinkId }: NodeMeta,
  name: string,
  documentType: DocumentType,
) {
  const {
    key: parentKey,
    hashKey: parentHashKey,
    address: { keys, address },
  } = await getParentKeys(api, getAddress, getVerificationKeys, volumeId, parentLinkId)
  const addressKey = keys[0].privateKey

  const [Hash, { NodeKey, NodePassphrase, NodePassphraseSignature, privateKey }, Name] = await Promise.all([
    generateLookupHash(name, parentHashKey),
    generateNodeKeys(parentKey, addressKey),
    encryptName(name, parentKey, addressKey),
  ])
  const { sessionKey, ContentKeyPacket, ContentKeyPacketSignature } = await generateContentKeys(privateKey)
  // Documents do not have any blocks, so we sign an empty array.
  const ManifestSignature = await sign(new Uint8Array([]), addressKey)

  const { Document } = await api<{ Document: { LinkID: string } }>({
    method: 'post',
    url: `drive/v2/volumes/${volumeId}/documents`,
    data: {
      ParentLinkID: parentLinkId,
      NodeKey,
      NodePassphrase,
      NodePassphraseSignature,
      SignatureAddress: address,
      Name,
      Hash,
      ContentKeyPacket,
      ContentKeyPacketSignature,
      ManifestSignature,
      DocumentType: documentType === 'doc' ? 1 : 2,
    },
  })

  return {
    volumeId,
    linkId: Document.LinkID,
    keys: { documentContentKey: sessionKey, userAddressPrivateKey: addressKey, userOwnAddress: address },
  }
}

async function getParentKeys(
  api: Api,
  getAddress: GetAddressKeys,
  getVerificationKeys: GetVerificationKeys,
  volumeId: string,
  parentLinkId: string,
) {
  // SDK provides ancestors (mostly cached) but not their encrypted keys
  const hierarchy = await getDrive().getNodeHierarchy(generateNodeUid(volumeId, parentLinkId))
  const linkIds = hierarchy.map(({ uid }) => splitNodeUid(uid).nodeId)

  const [links, { key: shareKey, address }] = await Promise.all([
    getLinks(api, volumeId, linkIds),
    getShareKey(api, getAddress, getVerificationKeys, hierarchy),
  ])
  const parentHashKey = links[links.length - 1].Folder?.NodeHashKey
  if (!parentHashKey) {
    throw new Error('Creating documents in non-folders is not allowed')
  }

  let key = shareKey
  for (const [index, { Link }] of links.entries()) {
    const verificationKeys = await getLinkVerificationKeys(getVerificationKeys, Link, index > 0 ? key : undefined)
    key = await decryptKey(Link.NodeKey, Link.NodePassphrase, Link.NodePassphraseSignature, key, verificationKeys)
  }
  const hashKey = await decryptHashKey(parentHashKey, key)
  return { key, hashKey, address }
}

async function getShareKey(
  api: Api,
  getAddress: GetAddressKeys,
  getVerificationKeys: GetVerificationKeys,
  hierarchy: NodeEntity[],
) {
  const share = await getRootShare(api, hierarchy)
  const [address, verificationKeys] = await Promise.all([
    getAddress(share.AddressID),
    getVerificationKeys(share.Creator),
  ])
  const key = await decryptKey(
    share.Key,
    share.Passphrase,
    share.PassphraseSignature,
    address.keys.map(({ privateKey }) => privateKey),
    verificationKeys,
  )
  return { key, address }
}

// Like SDK, anonymous links are signed with the parent key, which is not available for the hierarchy root
async function getLinkVerificationKeys(
  getVerificationKeys: GetVerificationKeys,
  { SignatureEmail }: LinkDetails['Link'],
  parentKey: PrivateKeyReference | undefined,
) {
  if (SignatureEmail) {
    return getVerificationKeys(SignatureEmail)
  }
  return parentKey ? [parentKey] : []
}

// Returned in the requested order, which API does not guarantee
async function getLinks(api: Api, volumeId: string, linkIds: string[]) {
  const { Links } = await api<{ Links: LinkDetails[] }>({
    method: 'post',
    url: `drive/v2/volumes/${volumeId}/links`,
    data: { LinkIDs: linkIds },
  })
  return linkIds.map((linkId) => {
    const link = Links.find(({ Link }) => Link.LinkID === linkId)
    if (!link) {
      throw new Error('Link not found')
    }
    return link
  })
}

async function decryptKey(
  armoredKey: string,
  armoredPassphrase: string,
  armoredSignature: string,
  decryptionKeys: PrivateKeyReference | PrivateKeyReference[],
  verificationKeys: PublicKeyReference[],
) {
  const { data: passphrase, verificationStatus } = await CryptoProxy.decryptMessage({
    armoredMessage: armoredPassphrase,
    armoredSignature,
    decryptionKeys,
    verificationKeys,
  })
  // Like legacy and SDK, failed verification is reported without blocking
  if (verificationKeys.length > 0 && verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
    traceErrorSDK(new Error('Failed to verify key passphrase signature'), 'DocsDriveCompatSDK')
  }
  return CryptoProxy.importPrivateKey({ armoredKey, passphrase })
}

async function decryptHashKey(armoredHashKey: string, nodeKey: PrivateKeyReference) {
  const { data } = await CryptoProxy.decryptMessage({
    armoredMessage: armoredHashKey,
    decryptionKeys: nodeKey,
    format: 'binary',
  })
  return data
}
