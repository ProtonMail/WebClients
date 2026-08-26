import type { PrivateKeyReference, SessionKey } from '@protontech/crypto'

export type DocumentKeys = {
  documentContentKey: SessionKey
  userAddressPrivateKey: PrivateKeyReference
  userOwnAddress: string
}

export type PublicDocumentKeys = {
  documentContentKey: SessionKey
  userAddressPrivateKey?: PrivateKeyReference
  userOwnAddress?: string
}
