import type { HomepageMessages } from './messages/defaultHomepageMessages'

export type OwnerContact = { Email: string; Name?: string }

export type OwnedDocument = { createdBy: string | undefined }

export function getOwnerName(
  recentDocument: OwnedDocument,
  isMine: boolean,
  contactEmails: OwnerContact[] | undefined,
  names: HomepageMessages['names'],
) {
  if (isMine) {
    return names.me
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
