import type { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'
import type { DocsLogger } from './contract/DocsLogger'
import type { SafeDocsUserState } from './contract/Awareness'
import type { WordCountInfoCollection } from './Utils/WordCount/WordCountTypes'
import type { DocsComments } from './contract/DocsComments'

export type DocsDependencies = {
  userName: string
  suggestionsEnabled: boolean
  isAlpha: boolean
  canEdit: boolean
  canComment: boolean
  languageCode: Intl.LocalesArgument
  getDisplayNameForEmail: (email: string | undefined) => string
  comments: DocsComments
  reportError: (error: unknown, extra?: Record<string, unknown>) => void
  logger: DocsLogger
  openLink: (url: string) => void
  showGenericAlertModal: (message: string) => void
  createWarningNotification: (message: string) => void
  createInfoNotification: (message: string) => void
  showAlert: (title: string, message: string) => void
  reportToolbarInteraction: () => void
  reportWordCount: (wordCount: WordCountInfoCollection) => void
  subscribeToCollaboratorCursorNavigation: (callback: (state: SafeDocsUserState) => void) => () => void
  createSuggestionThread: DocsComments['createSuggestionThread']
  getAllThreads: DocsComments['getAllThreads']
  reopenSuggestion: DocsComments['reopenSuggestion']
  rejectSuggestion: DocsComments['rejectSuggestion']
  getDocumentUrl: () => Promise<string>
  replaceDocumentUrl: (url: string) => Promise<void>
  reportTelemetry: (event: TelemetryDocsEditorEvents) => void
}

const DocsDependenciesContext = createContext<DocsDependencies | undefined>(undefined)

export function DocsDependenciesProvider({
  children,
  dependencies,
}: PropsWithChildren<{ dependencies: DocsDependencies }>) {
  return <DocsDependenciesContext.Provider value={dependencies}>{children}</DocsDependenciesContext.Provider>
}

export function useDocsDependencies(): DocsDependencies {
  const dependencies = useContext(DocsDependenciesContext)
  if (!dependencies) {
    throw new Error('DocsDependenciesProvider is missing')
  }
  return dependencies
}
