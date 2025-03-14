import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { UserModel } from '@proton/shared/lib/interfaces'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { PublicDriveCompat } from '@proton/drive-store/lib'
import type { DocumentAction } from '@proton/drive-store/store/_documents/useOpenDocument'

export type PublicContextValue = {
  user: UserModel | undefined
  compat: PublicDriveCompat
  localID: number | undefined
  openParams: DocumentAction
}

export type PrivateContextValue = {
  user: UserModel
  compat: DriveCompat
}

export type DocsContextValue = {
  privateContext: PrivateContextValue | undefined
  publicContext: PublicContextValue | undefined
  surePrivateContext: PrivateContextValue
  surePublicContext: PublicContextValue
}

const DocsContext = createContext<DocsContextValue | undefined>(undefined)

export function useDocsContext() {
  const value = useContext(DocsContext)
  if (!value) {
    throw new Error('Missing Docs context')
  }
  return value
}

export type DocsProviderProps = {
  privateContext: PrivateContextValue | undefined
  publicContext: PublicContextValue | undefined
  children: ReactNode
}

export function DocsProvider({ publicContext, privateContext, children }: DocsProviderProps) {
  return (
    <DocsContext.Provider
      value={{ publicContext, privateContext, surePrivateContext: privateContext!, surePublicContext: publicContext! }}
    >
      {children}
    </DocsContext.Provider>
  )
}
