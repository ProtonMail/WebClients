import type { NodeEntity } from '@proton/drive'
import { c } from 'ttag'

export function getAuthorName(author: NodeEntity['keyAuthor']) {
  if (author.ok) {
    if (author.value === null) {
      return c('Label').t`Unknown user`
    }
    return author.value
  }

  if (author.error && author.error.claimedAuthor) {
    return author.error.claimedAuthor
  }

  return c('Label').t`Unknown user`
}
