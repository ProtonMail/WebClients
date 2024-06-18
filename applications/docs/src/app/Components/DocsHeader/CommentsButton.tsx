import { Button } from '@proton/atoms'
import { Icon } from '@proton/components'
import { DocControllerInterface } from '@proton/docs-core'
import { useEffect, useState } from 'react'
import { useApplication } from '../../Containers/ApplicationProvider'
import { CommentsChangedData, CommentsEvent } from '@proton/docs-shared'
import clsx from '@proton/utils/clsx'

export function CommentsButton({ controller }: { controller: DocControllerInterface }) {
  const application = useApplication()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    return application.eventBus.addEventCallback<CommentsChangedData>((data) => {
      setHasUnread(data.hasUnreadThreads)
    }, CommentsEvent.CommentsChanged)
  }, [application.eventBus])

  return (
    <Button
      icon
      shape="ghost"
      data-testid="comments-button"
      className="flex items-center justify-center gap-2 text-sm"
      onClick={() => controller.showCommentsPanel()}
    >
      <div
        className={clsx(
          'relative flex items-center justify-center',
          hasUnread &&
            'after:absolute after:right-0 after:top-0 after:block after:h-[11px] after:w-[11px] after:-translate-y-[3px] after:translate-x-[3px] after:rounded-full after:border-[3px] after:border-[--background-norm] after:bg-[--signal-danger]',
        )}
      >
        <Icon name="speech-bubble" />
      </div>
    </Button>
  )
}
