import { Button } from '@proton/atoms/Button/Button'
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble'
import clsx from '@proton/utils/clsx'
import { c } from 'ttag'

export type CommentsButtonProps = {
  hasUnread: boolean
  /** Opens the comments panel; without it the button is disabled */
  onShowComments?: () => void
}

// Adapted from `applications/docs/src/app/components/document/DocumentLayout/DocumentHeader/CommentsButton.tsx`, which
// imports docs-core: the unread state and the panel come in as props, it is disabled until it can open the panel, and
// its icon is named.
export function CommentsButton({ hasUnread, onShowComments }: CommentsButtonProps) {
  return (
    <Button
      icon
      shape="ghost"
      data-testid="comments-button"
      className="flex items-center justify-center gap-2 head-max-849:!border head-max-849:!border-[--border-norm] head-max-849:!p-[0.5em]"
      disabled={!onShowComments}
      onClick={onShowComments}
    >
      <div
        className={clsx(
          'relative flex items-center justify-center',
          hasUnread &&
            'after:absolute after:right-0 after:top-0 after:block after:h-[11px] after:w-[11px] after:-translate-y-[3px] after:translate-x-[3px] after:rounded-full after:border-[3px] after:border-[--background-norm] after:bg-[--signal-danger]',
        )}
        data-testid={hasUnread ? 'comments-unread-dot' : undefined}
      >
        <IcSpeechBubble alt={c('Action').t`Comments`} />
      </div>
    </Button>
  )
}
