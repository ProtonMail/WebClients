import { useEffect, useState } from 'react'
import type { DocsCommentThread } from '../../contract/DocsCommentThread'
import { CommentsPanelListThread } from './CommentsPanelListThread'

export function CommentsPanelList({ threads }: { threads: DocsCommentThread[] }): JSX.Element {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    // Used to keep the time stamp up to date
    const id = setTimeout(() => {
      setCounter(counter + 1)
    }, 10000)

    return () => {
      clearTimeout(id)
    }
  }, [counter])

  return (
    <ul>
      {threads.map((thread) => {
        return <CommentsPanelListThread key={thread.id} thread={thread} data-testid="comments-thread-panel" />
      })}
    </ul>
  )
}
