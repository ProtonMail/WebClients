import { Icon } from '@proton/components/components'
import { CommentsPanelList } from './CommentsPanelList'
import { CommentThreadInterface, CommentThreadState } from '@proton/docs-shared'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { c } from 'ttag'
import { memo, useMemo } from 'react'

function CommentsPanel({
  threads,
  setShowComments,
}: {
  threads: CommentThreadInterface[]
  setShowComments: (show: boolean) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const isEmpty = threads.length === 0

  const active = useMemo(
    () => threads.filter((thread) => thread.state === CommentThreadState.Active).reverse(),
    [threads],
  )
  const resolved = useMemo(() => threads.filter((thread) => thread.state === CommentThreadState.Resolved), [threads])

  return (
    <div className="z-30 flex flex-col flex-nowrap overflow-hidden border-l border-[--border-weak] bg-[--background-weak] [grid-column:2] [grid-row:2] print:hidden">
      <div className="flex flex-shrink-0 items-center justify-between gap-2 px-4 py-2.5">
        <h2 className="text-base font-semibold">{c('Info').t`Comments`}</h2>
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
          {c('Info').t`No comments`}
        </div>
      ) : (
        <div className="w-full flex-grow overflow-y-auto px-4 pb-2 pt-1 focus:-outline-offset-2">
          <CommentsPanelList threads={active} />
          {resolved.length > 0 && (
            <>
              <div className="color-weak mb-1.5 mt-4 text-sm font-medium">Resolved</div>
              <CommentsPanelList threads={resolved} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(CommentsPanel)
