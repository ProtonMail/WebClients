import { TimeIntl } from '@proton/components/components'
import { ServerTime } from '@proton/docs-shared'
import { useMemo } from 'react'

export function CommentTime({ createTime }: { createTime: ServerTime }) {
  const createTimeUtil = useMemo(() => new ServerTime(createTime.serverTimestamp), [createTime.serverTimestamp])

  if (createTimeUtil.isNewerThan(10, 'seconds')) {
    return <span>Just now</span>
  }

  if (createTimeUtil.isNewerThan(60, 'minutes')) {
    return <span>{createTimeUtil.relativeFormat(createTimeUtil.relativeMinutes, 'minute')}</span>
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
