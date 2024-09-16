import { createContext, useContext } from 'react'
import type { Application } from './Application'

const ApplicationContext = createContext<{
  application: Application
  isSuggestionMode: boolean
  isSuggestionsFeatureEnabled: boolean
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
  isSuggestionMode,
  isSuggestionsFeatureEnabled,
}: {
  children: React.ReactNode
  application: Application
  isSuggestionMode: boolean
  isSuggestionsFeatureEnabled: boolean
}) {
  return (
    <ApplicationContext.Provider
      value={{ application, isSuggestionMode, isSuggestionsFeatureEnabled: isSuggestionsFeatureEnabled }}
    >
      {children}
    </ApplicationContext.Provider>
  )
}
