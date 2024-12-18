import { createContext, useContext } from 'react'
import type { Application } from '../Lib/Application'

const ApplicationContext = createContext<{
  application: Application
} | null>(null)

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
  return <ApplicationContext.Provider value={{ application }}>{children}</ApplicationContext.Provider>
}
