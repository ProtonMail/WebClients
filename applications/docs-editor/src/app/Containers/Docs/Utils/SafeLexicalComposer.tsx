import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import type { ReactNode } from 'react'
import React from 'react'
import { c } from 'ttag'
import { useDocsDependencies } from '../DocsDependenciesProvider'

type ComposerErrorBoundaryProps = {
  children: ReactNode
  onError: (error: Error) => void
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
          <p>{c('Info').t`Something went wrong:`}</p>
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
  return (
    <ComposerErrorBoundary onError={reportError}>
      <LexicalComposer initialConfig={initialConfig}>{children}</LexicalComposer>
    </ComposerErrorBoundary>
  )
}
