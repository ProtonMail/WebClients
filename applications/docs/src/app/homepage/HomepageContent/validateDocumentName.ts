import type { HomepageMessages } from '../messages/defaultHomepageMessages'

/** The longest name Drive accepts, `MAX_NAME_LENGTH` in `@proton/shared/lib/drive/constants` */
const MAX_NAME_LENGTH = 255

/**
 * Why Drive would refuse `name` as a document's name, or undefined if it accepts it. Adapted from `@proton/drive`'s
 * `validateNodeName`, which Drive's Rename and New file dialogs use. The Drive API can't check names, which are
 * encrypted, so every client has to.
 */
export function validateDocumentName(
  name: string,
  messages: HomepageMessages['documentsTable']['invalidName'],
): string | undefined {
  if (!name) {
    return messages.empty
  }
  if (name.length > MAX_NAME_LENGTH) {
    return messages.tooLong(MAX_NAME_LENGTH)
  }
  if (name.includes('/')) {
    return messages.slashes
  }
  return undefined
}
