import type { NodeKey } from 'lexical'
import { useRef } from 'react'
import { Icon } from '@proton/components/components'
import { CommentsPanelList } from './CommentsPanelList'
import { CommentThreadInterface } from '@proton/docs-shared'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { EditorRequiresClientMethods } from '@proton/docs-shared'

export function CommentsPanel({
  activeIDs,
  threads,
  markNodeMap,
  setShowComments,
  controller,
  resolveMarkNode,
  unresolveMarkNode,
  removeMarkNode,
  username,
}: {
  username: string
  activeIDs: string[]
  threads: CommentThreadInterface[]
  markNodeMap: Map<string, Set<NodeKey>>
  setShowComments: (show: boolean) => void
  controller: EditorRequiresClientMethods
  resolveMarkNode: (markID: string) => void
  unresolveMarkNode: (markID: string) => void
  removeMarkNode: (markID: string) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const listRef = useRef<HTMLUListElement>(null)
  const isEmpty = threads.length === 0

  return (
    <div className="z-30 flex flex-col flex-nowrap overflow-hidden border-l border-[--border-weak] bg-[--background-weak] [grid-column:2] [grid-row:2]">
      <div className="flex flex-shrink-0 items-center justify-between gap-2 px-4 py-2.5">
        <h2 className="text-base font-semibold">Comments</h2>
        <button
          aria-label="Close comments"
          className="flex items-center justify-center rounded-full p-1 hover:bg-[--background-strong]"
          onClick={() => {
            setShowComments(false)
            editor.focus()
          }}
        >
          <Icon name="cross" className="h-6 w-6 fill-current" />
        </button>
      </div>
      {isEmpty ? (
        <div className="flex min-h-0 flex-grow flex-col items-center justify-center px-3.5 text-center text-sm text-[color:--text-weak]">
          No Comments
        </div>
      ) : (
        <CommentsPanelList
          username={username}
          activeIDs={activeIDs}
          threads={threads}
          listRef={listRef}
          markNodeMap={markNodeMap}
          controller={controller}
          resolveMarkNode={resolveMarkNode}
          unresolveMarkNode={unresolveMarkNode}
          removeMarkNode={removeMarkNode}
        />
      )}
    </div>
  )
}
