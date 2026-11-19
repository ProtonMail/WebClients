import type { NodeEntity } from '@protontech/drive-sdk'
import type { HomepageMessages } from '../messages/defaultHomepageMessages'

export function getAuthorName(author: NodeEntity['keyAuthor'], names: HomepageMessages['names']) {
  if (author.ok) {
    if (author.value === null) {
      return names.unknownUser
    }
    return author.value
  }

  if (author.error && author.error.claimedAuthor) {
    return author.error.claimedAuthor
  }

  return names.unknownUser
}
