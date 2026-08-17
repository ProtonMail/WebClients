import { findUserAddress } from '@proton/shared/lib/helpers/address'
import type { Address } from '@proton/shared/lib/interfaces'
import type { RecentDocumentsItem } from '@proton/docs-core'

export function isMyDocument(document: RecentDocumentsItem, addresses: Address[] | undefined): boolean {
  if (!addresses) {
    return false
  }
  return !!findUserAddress(document.createdBy, addresses)
}
