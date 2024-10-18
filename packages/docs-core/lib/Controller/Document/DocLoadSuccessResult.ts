import type { DocumentMetaInterface } from '@proton/docs-shared'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../../Types/DocumentEntitlements'

export type PrivateDocLoadSuccessResult = {
  entitlements: DocumentEntitlements
}

export type PublicDocLoadSuccessResult = {
  entitlements: PublicDocumentEntitlements
  meta: DocumentMetaInterface
}
