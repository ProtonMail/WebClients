import type { ReactNode } from 'react'
import { createContext, useContext, memo } from 'react'
import type { UserModel } from '@proton/shared/lib/interfaces'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { PublicDriveCompat } from '@proton/drive-store/lib'

export type PublicContextType = {
  user: UserModel | undefined
  compat: PublicDriveCompat
}

export type PrivateContextType = {
  user: UserModel
  compat: DriveCompat
}

export type DocsContextType = {
  privateContext: PrivateContextType | undefined
  publicContext: PublicContextType | undefined
}

const DocsContext = createContext<DocsContextType | undefined>(undefined)

export const useDocsContext = () => {
  const value = useContext(DocsContext)

  if (!value) {
    throw new Error('Component must be a child of <UserProvider />')
  }

  return value
}

type ChildrenProps = {
  children: ReactNode
}

type ProviderProps = DocsContextType & ChildrenProps

const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const DocsProvider = ({ publicContext, privateContext, children }: ProviderProps) => {
  return (
    <DocsContext.Provider value={{ publicContext, privateContext }}>
      <MemoizedChildren children={children} />
    </DocsContext.Provider>
  )
}

export default DocsProvider
