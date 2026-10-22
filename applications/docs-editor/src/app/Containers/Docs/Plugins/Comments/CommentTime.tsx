import type { DocsCommentTime } from '../../contract/DocsCommentThread'
import type { DocsDateFormat } from '../../contract/DocsDateFormat'
import { useDocsMessages } from '../../DocsDependenciesProvider'
import { commentDate, formatAbsoluteTime, formatRelativeTime, isNewerThan } from '../../Utils/commentTime'

export type CommentTimeProps = {
  createTime: DocsCommentTime
  languageCode: Intl.LocalesArgument
  dateFormat: DocsDateFormat
}

export function CommentTime({ createTime, languageCode, dateFormat }: CommentTimeProps) {
  const messages = useDocsMessages().comments
  if (isNewerThan(createTime, 10, 'seconds')) {
    return <span data-testid="comment-time-just-now">{messages.justNow}</span>
  }

  if (isNewerThan(createTime, 60, 'minutes')) {
    return <span data-testid="comment-time-ago">{formatRelativeTime(createTime, languageCode)}</span>
  }

  return <time dateTime={commentDate(createTime).toISOString()}>{formatAbsoluteTime(createTime, dateFormat)}</time>
}
