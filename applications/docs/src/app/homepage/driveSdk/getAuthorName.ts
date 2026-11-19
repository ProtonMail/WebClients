import type { NodeEntity } from '@protontech/drive-sdk'
import { createNamesMessages } from '../messages/names'

export function getAuthorName(author: NodeEntity['keyAuthor']) {
  if (author.ok) {
    if (author.value === null) {
      return createNamesMessages().names.unknownUser
    }
    return author.value
  }

  if (author.error && author.error.claimedAuthor) {
    return author.error.claimedAuthor
  }

  return createNamesMessages().names.unknownUser
}
