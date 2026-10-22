import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import type { ReactNode } from 'react'
import React from 'react'
import { useDocsDependencies, useDocsMessages } from '../DocsDependenciesProvider'

export const safeLexicalComposerMessages = {
  safeLexicalComposer: {
    somethingWentWrong: 'Something went wrong:',
  },
}

type ComposerErrorBoundaryProps = {
  children: ReactNode
  onError: (error: Error) => void
  errorLabel: string
}

type ComposerErrorBoundaryState = {
  error?: Error
}

class ComposerErrorBoundary extends React.Component<ComposerErrorBoundaryProps, ComposerErrorBoundaryState> {
  state: ComposerErrorBoundaryState = {}

  static getDerivedStateFromError(error: Error): ComposerErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error): void {
    this.props.onError(error)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert">
          <p>{this.props.errorLabel}</p>
          <pre>{this.state.error.message}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

export const SafeLexicalComposer: React.FC<{
  initialConfig: InitialConfigType
  children: ReactNode
}> = ({ initialConfig, children }) => {
  const { reportError } = useDocsDependencies()
  const messages = useDocsMessages().safeLexicalComposer
  return (
    <ComposerErrorBoundary onError={reportError} errorLabel={messages.somethingWentWrong}>
      <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
    </ComposerErrorBoundary>
  )
}
