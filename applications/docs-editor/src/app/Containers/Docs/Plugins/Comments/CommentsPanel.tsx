import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { CommentThreadInterface } from '@proton/docs-shared'
import { IcCross } from '@proton/icons/icons/IcCross'
import { CommentThreadState } from '@proton/docs-shared'
import clsx from '@proton/utils/clsx'
import { memo, useMemo } from 'react'
import { c } from 'ttag'
import { CommentsPanelList } from './CommentsPanelList'

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
  const resolved = useMemo(() => threads.filter((thread) => thread.state !== CommentThreadState.Active), [threads])

  return (
    <div
      className={clsx(
        'z-30 flex h-full max-h-full min-h-0 flex-col flex-nowrap self-end overflow-hidden bg-[--background-weak] [grid-row:2] print:hidden',
        'mr-2 w-[max(20.5vw,300px)] max-w-[480px] rounded-md border border-[--border-weak] [grid-column:2]',
        'max-[815px]:w-full max-[815px]:max-w-none max-[815px]:rounded-none max-[815px]:border-0 max-[815px]:[grid-column:1]',
      )}
      data-testid="comments-main-section"
    >
      <div className="flex flex-shrink-0 items-center justify-between gap-2 px-4 py-2.5">
        <h2 className="text-base font-semibold">{c('Info').t`Comments`}</h2>
        <button
          aria-label="Close comments"
          className="flex items-center justify-center rounded-full p-1 hover:bg-[--background-strong]"
          onClick={() => {
            setShowComments(false)
            editor.focus()
          }}
          data-testid="close-comments-section"
        >
          <IcCross className="h-6 w-6 fill-current" />
        </button>
      </div>
      {isEmpty ? (
        <div
          className="flex min-h-0 flex-grow flex-col items-center justify-center px-3.5 text-center text-sm text-[color:--text-weak]"
          data-testid="empty-comments-section"
        >
          {c('Info').t`No comments`}
        </div>
      ) : (
        <div
          className="w-full flex-grow overflow-y-auto px-4 pb-2 pt-1 focus:-outline-offset-2"
          data-testid="comments-list"
        >
          <CommentsPanelList threads={active} data-testid="active-comments-list" />
          {resolved.length > 0 && (
            <>
              <div className="color-weak mb-1.5 mt-4 text-sm font-medium" data-testid="resolved-comments-text">
                Resolved
              </div>
              <CommentsPanelList threads={resolved} data-testid="resolved-comments-list" />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(CommentsPanel)
