import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import type { RecentDocumentItem } from '@proton/docs-core'
import { c } from 'ttag'

export const getDisplayName = (recentDocument: RecentDocumentItem, contactEmails?: ContactEmail[]) => {
  if (!recentDocument.isSharedWithMe) {
    return c('Info').t`Me`
  }

  if (!recentDocument.createdBy) {
    return undefined
  }

  const foundContact = contactEmails?.find((contactEmail) => contactEmail.Email === recentDocument.createdBy)

  if (foundContact) {
    return foundContact.Name ?? foundContact.Email
  }

  return recentDocument.createdBy
}
