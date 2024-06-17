import { createContext, useContext } from 'react'
import { Application } from './Application'

const ApplicationContext = createContext<Application | null>(null)

export function useApplication() {
  const value = useContext(ApplicationContext)
  if (!value) {
    throw new Error('Application instance not found')
  }
  return value
}

export function ApplicationProvider({
  children,
  application,
}: {
  children: React.ReactNode
  application: Application
}) {
  return <ApplicationContext.Provider value={application}>{children}</ApplicationContext.Provider>
}
