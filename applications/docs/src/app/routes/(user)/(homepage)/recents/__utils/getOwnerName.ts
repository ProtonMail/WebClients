import { c } from 'ttag'

type OwnerContact = { Email: string; Name?: string }

type OwnedDocument = { createdBy: string | undefined }

export function getOwnerName(
  recentDocument: OwnedDocument,
  isMine: boolean,
  contactEmails: OwnerContact[] | undefined,
) {
  if (isMine) {
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
