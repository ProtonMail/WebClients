import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import type { ReactNode } from 'react'
import React from 'react'
import { c } from 'ttag'
import { useDocsDependencies } from '../DocsDependenciesProvider'

export const SafeLexicalComposer: React.FC<{
  initialConfig: InitialConfigType
  children: ReactNode
}> = ({ initialConfig, children }) => {
  const { reportError } = useDocsDependencies()
  return (
    <ErrorBoundary
      onError={(error) => {
        reportError(error)
      }}
      renderFunction={(error) => (
        <div role="alert">
          <p>{c('Info').t`Something went wrong:`}</p>
          <pre>{error?.message}</pre>
        </div>
      )}
    >
      <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
    </ErrorBoundary>
  )
}
