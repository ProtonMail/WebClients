import { InternalEventBusInterface } from '@proton/docs-shared'
import { createContext, useContext } from 'react'

const InternalEventBusContext = createContext<InternalEventBusInterface | null>(null)

export function useInternalEventBus() {
  const value = useContext(InternalEventBusContext)
  if (!value) {
    throw new Error('InternalEventBus instance not found')
  }
  return value
}

export function InternalEventBusProvider({
  children,
  eventBus,
}: {
  children: React.ReactNode
  eventBus: InternalEventBusInterface
}) {
  return <InternalEventBusContext.Provider value={eventBus}>{children}</InternalEventBusContext.Provider>
}
