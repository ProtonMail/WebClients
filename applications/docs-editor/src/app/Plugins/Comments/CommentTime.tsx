import { TimeIntl } from '@proton/components'
import { ServerTime } from '@proton/docs-shared'
import { useMemo } from 'react'
import { c } from 'ttag'

export function CommentTime({
  createTime,
  languageCode,
}: {
  createTime: ServerTime
  languageCode: Intl.LocalesArgument
}) {
  const createTimeUtil = useMemo(() => new ServerTime(createTime.serverTimestamp), [createTime.serverTimestamp])

  if (createTimeUtil.isNewerThan(10, 'seconds')) {
    return (
      <span data-testid="comment-time-just-now">{
        // translator: indicates the comment has been added less than 10 seconds ago
        c('Info').t`Just now`
      }</span>
    )
  }

  if (createTimeUtil.isNewerThan(60, 'minutes')) {
    return (
      <span data-testid="comment-time-ago">
        {createTimeUtil.relativeFormat(createTimeUtil.relativeMinutes, 'minute', languageCode)}
      </span>
    )
  }

  return (
    <TimeIntl
      options={{
        year: 'numeric',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
      }}
    >
      {createTimeUtil.serverTimestamp}
    </TimeIntl>
  )
}
