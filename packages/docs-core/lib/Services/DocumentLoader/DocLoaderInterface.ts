import type { NodeMeta, PublicNodeMeta, DocumentType } from '@proton/docs-shared'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import type { PrimaryAddressKeys } from '../../DriveSDK/getDocumentKeys'

export interface DocLoaderInitializeOptions {
  primaryAddressKeys?: PrimaryAddressKeys
  localID?: number
}

export interface DocLoaderInterface<S extends DocumentState | PublicDocumentState> {
  initialize(
    lookup: NodeMeta | PublicNodeMeta,
    documentType: DocumentType,
    options?: DocLoaderInitializeOptions,
  ): Promise<void>
  addStatusObserver(observer: DocLoaderStatusObserver<S>): () => void
  destroy(): void
}
