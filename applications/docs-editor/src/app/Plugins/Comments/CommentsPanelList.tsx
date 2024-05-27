import type { NodeKey } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'
import { CommentThreadInterface } from '@proton/docs-shared'
import { CommentsPanelListThread } from './CommentsPanelListThread'
import { EditorRequiresClientMethods } from '@proton/docs-shared'

export function CommentsPanelList({
  activeIDs,
  threads,
  listRef,
  markNodeMap,
  controller,
  resolveMarkNode,
  unresolveMarkNode,
  removeMarkNode,
  username,
}: {
  username: string
  activeIDs: string[]
  threads: CommentThreadInterface[]
  listRef: { current: null | HTMLUListElement }
  markNodeMap: Map<string, Set<NodeKey>>
  controller: EditorRequiresClientMethods
  resolveMarkNode: (markID: string) => void
  unresolveMarkNode: (markID: string) => void
  removeMarkNode: (markID: string) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
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
        return (
          <CommentsPanelListThread
            username={username}
            key={thread.id}
            thread={thread}
            controller={controller}
            activeIDs={activeIDs}
            editor={editor}
            markNodeMap={markNodeMap}
            resolveMarkNode={resolveMarkNode}
            unresolveMarkNode={unresolveMarkNode}
            removeMarkNode={removeMarkNode}
          />
        )
      })}
    </ul>
  )
}
