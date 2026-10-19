import { c } from 'ttag'
import type { DocsCommentTime } from '../../contract/DocsCommentThread'
import type { DocsDateFormat } from '../../contract/DocsDateFormat'
import { commentDate, formatAbsoluteTime, formatRelativeTime, isNewerThan } from '../../Utils/commentTime'

export type CommentTimeProps = {
  createTime: DocsCommentTime
  languageCode: Intl.LocalesArgument
  dateFormat: DocsDateFormat
}

export function CommentTime({ createTime, languageCode, dateFormat }: CommentTimeProps) {
  if (isNewerThan(createTime, 10, 'seconds')) {
    return (
      <span data-testid="comment-time-just-now">{
        // translator: indicates the comment has been added less than 10 seconds ago
        c('Info').t`Just now`
      }</span>
    )
  }

  if (isNewerThan(createTime, 60, 'minutes')) {
    return <span data-testid="comment-time-ago">{formatRelativeTime(createTime, languageCode)}</span>
  }

  return <time dateTime={commentDate(createTime).toISOString()}>{formatAbsoluteTime(createTime, dateFormat)}</time>
}
