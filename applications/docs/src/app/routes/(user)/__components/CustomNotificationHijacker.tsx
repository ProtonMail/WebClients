import type { ReactNode } from 'react'
import { useContext } from 'react'

import type { CreateNotificationOptions } from '@proton/components'
import { NotificationsContext, type NotificationsContextValue } from '@proton/components'

export type CustomNotificationsHijackProps = {
  ignoredNotifications: string[]
  children?: ReactNode
}

export default function CustomNotificationsHijack({ children, ignoredNotifications }: CustomNotificationsHijackProps) {
  const parentContext = useContext(NotificationsContext)

  const hijackedCreateNotification = (options: CreateNotificationOptions) => {
    if (options.text && typeof options.text === 'string' && ignoredNotifications.includes(options.text)) {
      /* createNotification has to return a number */
      return 42
    }
    return parentContext.createNotification(options)
  }

  const context: NotificationsContextValue = {
    ...parentContext,
    createNotification: hijackedCreateNotification,
  }

  return <NotificationsContext.Provider value={context}>{children}</NotificationsContext.Provider>
}
