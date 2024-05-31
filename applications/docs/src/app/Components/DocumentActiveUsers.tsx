import { useEffect, useState } from 'react'
import { UserState } from '@lexical/yjs'
import { Tooltip } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { useApplication } from '../Containers/ApplicationProvider'
import { DocAwarenessEvent, DocsAwarenessStateChangeData } from '@proton/docs-shared'

export function DocumentActiveUsers() {
  const application = useApplication()
  const [states, setStates] = useState<UserState[]>([])

  useEffect(() => {
    return application.eventBus.addEventCallback<DocsAwarenessStateChangeData>((data) => {
      setStates(data.states)
    }, DocAwarenessEvent.AwarenessStateChange)
  }, [application.eventBus])

  if (states.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {states.map(({ name, color, focusing }, index) => {
        let textColor = '#000'
        let backgroundColor = color
        try {
          const hue = parseInt(color.replace('hsl(', '').split(',')[0])
          backgroundColor = `hsl(${hue}, 100%, 80%)`
          textColor = `hsl(${hue}, 100%, 20%)`
        } catch {}
        return (
          <Tooltip title={name} key={index}>
            <div
              className={clsx(
                'flex h-8 w-8 select-none items-center justify-center rounded-lg text-center font-bold',
                !focusing && 'opacity-50',
              )}
              style={{ backgroundColor, color: textColor }}
            >
              {name.substring(0, 1).toUpperCase()}
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}
