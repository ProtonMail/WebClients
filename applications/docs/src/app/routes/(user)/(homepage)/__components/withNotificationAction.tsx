import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces'
import NotificationButton from '@proton/components/containers/notifications/NotificationButton'

import type { HomepageDependencies } from '~/homepage'

/** Wraps Proton's `createNotification` for the homepage module, rendering its `action`, such as "Undo", as a notification button. */
export function withNotificationAction(
  createNotification: (options: CreateNotificationOptions) => unknown,
): HomepageDependencies['createNotification'] {
  return ({ action, text, ...options }) => {
    createNotification({
      ...options,
      text: action ? (
        <>
          <span>{text}</span>
          <NotificationButton onClick={action.onClick}>{action.label}</NotificationButton>
        </>
      ) : (
        text
      ),
    })
  }
}
