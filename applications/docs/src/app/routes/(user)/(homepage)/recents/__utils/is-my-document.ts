import { findUserAddress } from '@proton/shared/lib/helpers/address'
import type { Address } from '@proton/shared/lib/interfaces/Address'
import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'

export function isMyDocument(document: RecentDocumentsItem, addresses: Address[] | undefined): boolean {
  if (!addresses) {
    return false
  }
  return !!findUserAddress(document.createdBy, addresses)
}
