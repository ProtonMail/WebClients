import { Component, ErrorInfo, ReactNode } from 'react'
import { sendErrorMessage } from './Utils/errorMessage'

interface ErrorBoundaryProps {
  children: ReactNode
}

// For now this error boundary does nothing else than pushing each errors to the parent window
class ErrorBoundary extends Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    sendErrorMessage(error, errorInfo)
  }

  static getDerivedStateFromError() {
    // no-op, it removes a warning
  }

  render() {
    return this.props.children
  }
}

export default ErrorBoundary
