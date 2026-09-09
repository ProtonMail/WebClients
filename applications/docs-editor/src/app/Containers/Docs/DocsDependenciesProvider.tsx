import type { CommentThreadInterface, SuggestionSummaryType } from '@proton/docs-shared'
import type { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

export type DocsDependencies = {
  isDevOrBlack: () => boolean
  openLink: (url: string) => void
  showGenericAlertModal: (message: string) => void
  createSuggestionThread(
    suggestionID: string,
    commentContent: string,
    suggestionType: SuggestionSummaryType,
  ): Promise<CommentThreadInterface | undefined>
  getAllThreads: () => Promise<CommentThreadInterface[]>
  reopenSuggestion: (threadId: string) => Promise<boolean>
  rejectSuggestion: (threadId: string, summary?: string | undefined) => Promise<boolean>
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
