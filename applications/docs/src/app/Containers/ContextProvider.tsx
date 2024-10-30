import type { ReactNode } from 'react'
import { createContext, useContext, memo } from 'react'
import type { UserModel } from '@proton/shared/lib/interfaces'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { PublicDriveCompat } from '@proton/drive-store/lib'
import type { DocumentAction } from '@proton/drive-store/store/_documents/useOpenDocument'

export type PublicContextType = {
  user: UserModel | undefined
  compat: PublicDriveCompat
  localID: number | undefined
  openParams: DocumentAction
}

export type PrivateContextType = {
  user: UserModel
  compat: DriveCompat
}

export type DocsContextType = {
  privateContext: PrivateContextType | undefined
  publicContext: PublicContextType | undefined
  surePrivateContext: PrivateContextType
  surePublicContext: PublicContextType
}

type ProviderProps = {
  privateContext: PrivateContextType | undefined
  publicContext: PublicContextType | undefined
} & ChildrenProps

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

// eslint-disable-next-line react/display-name
const MemoizedChildren = memo(({ children }: ChildrenProps) => <>{children}</>)

const DocsProvider = ({ publicContext, privateContext, children }: ProviderProps) => {
  return (
    <DocsContext.Provider
      value={{ publicContext, privateContext, surePrivateContext: privateContext!, surePublicContext: publicContext! }}
    >
      <MemoizedChildren children={children} />
    </DocsContext.Provider>
  )
}

export default DocsProvider
