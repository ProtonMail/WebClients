type MyDocumentCandidate = { createdBy: string | undefined }

type UserAddress ={ Email: string }

/**
 * Canonicalizes an email using the Proton scheme: drops the +alias, removes dots, underscores
 * and hyphens from the local part, and lowercases everything.
 */
function canonicalizeInternalEmail(email: string): string {
  const atIndex = email.lastIndexOf('@')
  const localPart = atIndex === -1 ? email : email.slice(0, atIndex)
  const domain = atIndex === -1 ? '' : email.slice(atIndex + 1)

  const [localPartWithoutAlias] = localPart.split('+')
  const normalizedLocalPart = localPartWithoutAlias.replace(/[._-]/g, '').toLowerCase()

  return atIndex === -1 ? normalizedLocalPart : `${normalizedLocalPart}@${domain.toLowerCase()}`
}

export function isMyDocument(document: MyDocumentCandidate, addresses: UserAddress[] | undefined): boolean {
  if (!addresses || !document.createdBy) {
    return false
  }
  const canonicalCreatedBy = canonicalizeInternalEmail(document.createdBy)
  return addresses.some(({ Email }) => canonicalizeInternalEmail(Email) === canonicalCreatedBy)
}
