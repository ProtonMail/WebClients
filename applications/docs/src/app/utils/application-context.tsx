import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { Application } from '@proton/docs-core'

const ApplicationContext = createContext<Application | undefined>(undefined)

export function useApplication() {
  const value = useContext(ApplicationContext)
  if (!value) {
    throw new Error('Missing Application context')
  }
  return value
}

export type ApplicationProviderProps = {
  application: Application
  children: ReactNode
}

export function ApplicationProvider({ application, children }: ApplicationProviderProps) {
  return <ApplicationContext.Provider value={application}>{children}</ApplicationContext.Provider>
}
