import { createNamesMessages } from './messages/names'

export type OwnerContact = { Email: string; Name?: string }

export type OwnedDocument = { createdBy: string | undefined }

export function getOwnerName(
  recentDocument: OwnedDocument,
  isMine: boolean,
  contactEmails: OwnerContact[] | undefined,
) {
  if (isMine) {
    return createNamesMessages().names.me
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
