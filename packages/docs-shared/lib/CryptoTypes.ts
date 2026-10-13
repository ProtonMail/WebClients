import type { PrivateKeyReference, SessionKey } from '@protontech/crypto'

import type { NodeMeta } from './BasicTypes'

export type DocumentKeys = {
  documentContentKey: SessionKey
  userAddressPrivateKey: PrivateKeyReference
  userOwnAddress: string
}

export type DocumentNodeMeta = NodeMeta & { keys: DocumentKeys }

export type PublicDocumentKeys = {
  documentContentKey: SessionKey
  userAddressPrivateKey?: PrivateKeyReference
  userOwnAddress?: string
}
