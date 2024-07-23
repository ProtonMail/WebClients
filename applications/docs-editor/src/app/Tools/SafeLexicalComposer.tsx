import type { ReactNode } from 'react'
import React from 'react'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { sendErrorMessage } from '../Utils/errorMessage'
import { ErrorBoundary } from '@proton/components/containers'
import { c } from 'ttag'

export const SafeLexicalComposer: React.FC<{
  initialConfig: InitialConfigType
  children: ReactNode
}> = ({ initialConfig, children }) => {
  return (
    <ErrorBoundary
      onError={(error) => {
        sendErrorMessage(error)
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
