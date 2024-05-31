import { ReactNode, createContext, useContext, memo } from 'react'
import { Application } from '@proton/docs-core'

const ApplicationContext = createContext<Application | undefined>(undefined)

export const useApplication = () => {
  const value = useContext(ApplicationContext)

  if (!value) {
    throw new Error('Component must be a child of <ApplicationProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = {
  application: Application
} & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const ApplicationProvider = ({ application, children }: ProviderProps) => {
  return (
    <ApplicationContext.Provider value={application}>
      <MemoizedChildren children={children} />
    </ApplicationContext.Provider>
  )
}

export default ApplicationProvider
