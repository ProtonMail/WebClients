import { createContext, type ReactNode, useContext } from 'react'
import { defaultHomepageMessages, type HomepageMessages } from './defaultHomepageMessages'

const HomepageMessagesContext = createContext<HomepageMessages>(defaultHomepageMessages)

export type HomepageMessagesProviderProps = {
  children: ReactNode
  /** The host's translated messages. Without this provider, the homepage shows the English defaults. */
  messages: HomepageMessages
}

export function HomepageMessagesProvider({ children, messages }: HomepageMessagesProviderProps) {
  return <HomepageMessagesContext.Provider value={messages}>{children}</HomepageMessagesContext.Provider>
}

export function useHomepageMessages() {
  return useContext(HomepageMessagesContext)
}
