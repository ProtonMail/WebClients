import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'
import type { DocsLogger } from './contract/DocsLogger'
import type { SafeDocsUserState } from './contract/Awareness'
import type { WordCountInfoCollection } from './Utils/WordCount/WordCountTypes'
import type { DocsComments } from './contract/DocsComments'
import type { DocsDateFormat } from './contract/DocsDateFormat'
import type { DocsEditorTelemetryEvent } from './contract/DocsEditorTelemetry'
import type { DocsMessages } from './messages/DocsMessages'

export type DocsDependencies = {
  userName: string
  messages?: DocsMessages
  defaultMessages?: DocsMessages
  emojiPickerEnabled?: boolean
  suggestionsEnabled: boolean
  isAlpha: boolean
  canEdit: boolean
  canComment: boolean
  languageCode: Intl.LocalesArgument
  dateFormat: DocsDateFormat
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
  reportTelemetry: (event: DocsEditorTelemetryEvent) => void
}

const DocsDependenciesContext = createContext<DocsDependencies | undefined>(undefined)
const DocsMessagesContext = createContext<DocsMessages | undefined>(undefined)

export function DocsDependenciesProvider({
  children,
  dependencies,
}: PropsWithChildren<{ dependencies: DocsDependencies }>) {
  const inheritedMessages = useContext(DocsMessagesContext)
  return (
    <DocsMessagesContext.Provider value={dependencies.messages ?? inheritedMessages ?? dependencies.defaultMessages}>
      <DocsDependenciesContext.Provider value={dependencies}>{children}</DocsDependenciesContext.Provider>
    </DocsMessagesContext.Provider>
  )
}

export function useDocsDependencies(): DocsDependencies {
  const dependencies = useContext(DocsDependenciesContext)
  if (!dependencies) {
    throw new Error('DocsDependenciesProvider is missing')
  }
  return dependencies
}

export function useDocsMessages(): DocsMessages {
  const messages = useContext(DocsMessagesContext)
  if (!messages) {
    throw new Error('Docs requires messages from a host provider or the standalone English entry.')
  }
  return messages
}
