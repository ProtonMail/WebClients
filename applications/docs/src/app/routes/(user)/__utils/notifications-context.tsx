import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { useDocsNotificationsSettings } from '@proton/components/hooks/docs/useDocsNotificationsSettings'

type DocsNotificationsContextValue = ReturnType<typeof useDocsNotificationsSettings>

const DocsNotificationsContext = createContext<DocsNotificationsContextValue | null>(null)

export function DocsNotificationsProvider({ children }: { children: ReactNode }) {
  const notificationSettings = useDocsNotificationsSettings()
  return <DocsNotificationsContext.Provider value={notificationSettings}>{children}</DocsNotificationsContext.Provider>
}

export function useDocsNotifications() {
  const context = useContext(DocsNotificationsContext)
  if (!context) {
    throw new Error('Missing DocsNotifications context')
  }
  return context
}
