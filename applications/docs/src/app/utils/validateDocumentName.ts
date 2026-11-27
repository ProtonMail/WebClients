import { c, msgid } from 'ttag'

import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants'

/**
 * Why Drive would refuse `name` as a document's name, or undefined if it accepts it. Copied from `@proton/drive`'s
 * `validateNodeName` (`packages/drive/modules/validation`), which Drive's Rename and New file dialogs use and docs
 * may not import. The Drive API can't check names, which are encrypted, so every client has to.
 */
export function validateDocumentName(name: string): string | undefined {
  if (!name) {
    return c('Validation Error').t`Name must not be empty`
  }
  if (name.length > MAX_NAME_LENGTH) {
    return c('Validation Error').ngettext(
      msgid`Name must be ${MAX_NAME_LENGTH} character long at most`,
      `Name must be ${MAX_NAME_LENGTH} characters long at most`,
      MAX_NAME_LENGTH,
    )
  }
  if (name.includes('/')) {
    return c('Validation Error').t`Name must not contain slashes (/)`
  }
  return undefined
}
