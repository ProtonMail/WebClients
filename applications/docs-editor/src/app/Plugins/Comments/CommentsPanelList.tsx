import { useEffect, useState } from 'react'
import { CommentThreadInterface } from '@proton/docs-shared'
import { CommentsPanelListThread } from './CommentsPanelListThread'

export function CommentsPanelList({
  threads,
  listRef,
}: {
  threads: CommentThreadInterface[]
  listRef: { current: null | HTMLUListElement }
}): JSX.Element {
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
    <ul className="w-full overflow-y-auto px-4 pb-2 pt-1" ref={listRef}>
      {threads.map((thread) => {
        return <CommentsPanelListThread key={thread.id} thread={thread} />
      })}
    </ul>
  )
}
