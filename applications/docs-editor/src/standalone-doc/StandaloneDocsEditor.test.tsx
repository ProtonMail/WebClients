import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { LexicalEditor } from 'lexical'
import {
  CommentThreadState,
  CommentThreadType,
  CommentType,
  DocumentRole,
  EditorSystemMode,
  ServerTime,
  type CommentThreadInterface,
} from '@proton/docs-shared'
import {
  DocsDependenciesProvider,
  EditorUserMode,
  StandaloneDocsEditor,
  type DocsDependencies,
  type DocsComments,
} from '../app/Containers/Docs/public'
import { PreviewModeEditor } from '../app/Containers/Docs/PreviewModeEditor'
import { SHOW_ALL_COMMENTS_COMMAND } from '../app/Containers/Docs/Commands'
import type { DocsCommentEvent } from '../app/Containers/Docs/contract/DocsComments'
import DocsLayout from '../app/Containers/DocsLayout'
import { createStandaloneDocClient } from './client'
import { createStandaloneDocSession } from './session'

function createThread(): CommentThreadInterface {
  const time = ServerTime.now()
  return {
    id: 'thread-id',
    localID: 'thread-id',
    markID: 'mark-id',
    createTime: time,
    modifyTime: time,
    state: CommentThreadState.Active,
    type: CommentThreadType.Comment,
    isPlaceholder: false,
    comments: [
      {
        id: 'comment-id',
        createTime: time,
        modifyTime: time,
        content: 'A loaded comment',
        parentCommentID: null,
        author: 'collaborator@example.test',
        comments: [],
        isPlaceholder: false,
        type: CommentType.Comment,
        verificationResult: { verified: true },
        asPayload: jest.fn(),
      },
    ],
    asPayload: jest.fn(),
  }
}

function createDependencies(comments: DocsComments, reportError: DocsDependencies['reportError']): DocsDependencies {
  return {
    userName: 'Local user',
    suggestionsEnabled: false,
    isAlpha: false,
    canEdit: true,
    canComment: true,
    languageCode: 'en',
    getDisplayNameForEmail: (email) => email ?? 'Anonymous',
    comments,
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    reportError,
    openLink: jest.fn(),
    showGenericAlertModal: jest.fn(),
    createWarningNotification: jest.fn(),
    createInfoNotification: jest.fn(),
    showAlert: jest.fn(),
    reportToolbarInteraction: jest.fn(),
    reportWordCount: jest.fn(),
    subscribeToCollaboratorCursorNavigation: jest.fn(() => () => {}),
    createSuggestionThread: comments.createSuggestionThread,
    getAllThreads: comments.getAllThreads,
    reopenSuggestion: comments.reopenSuggestion,
    rejectSuggestion: comments.rejectSuggestion,
    getDocumentUrl: jest.fn(async () => 'https://docs.example.test/document'),
    replaceDocumentUrl: jest.fn(async () => {}),
    reportTelemetry: jest.fn(),
  }
}

describe('standalone Docs runtime', () => {
  beforeAll(() => {
    // JSDOM does not implement visibility observation used by the toolbar.
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })
  it('mounts the full editing and preview editors with headings and loaded comments without shell providers', async () => {
    const reportError = jest.fn()
    const ready = jest.fn()
    const session = createStandaloneDocSession(ready, reportError)
    const role = new DocumentRole('Editor')
    let editor: LexicalEditor | null = null
    const setEditorRef = (instance: LexicalEditor | null) => {
      editor = instance
    }
    const onReady = () => session.editorLoaded()
    const eventListeners = new Set<(event: DocsCommentEvent) => void>()
    const unsubscribeEvents = jest.fn()
    const unsubscribeAwareness = jest.fn()
    const comments = createStandaloneDocClient(jest.fn(), session.subscribeToAwarenessStates)
    comments.getAllThreads = jest.fn(async () => [createThread()])
    comments.getTypersExcludingSelf = jest.fn(async () => [])
    comments.subscribeToEvents = jest.fn((callback) => {
      eventListeners.add(callback)
      return () => {
        eventListeners.delete(callback)
        unsubscribeEvents()
      }
    })
    comments.subscribeToAwarenessStates = jest.fn((callback) => {
      const unsubscribe = session.subscribeToAwarenessStates(callback)
      return () => {
        unsubscribe()
        unsubscribeAwareness()
      }
    })
    let dependencies = createDependencies(comments, reportError)
    const props = {
      docMap: session.docMap,
      docState: session.docState,
      documentId: session.documentId,
      editingLocked: false,
      role,
      onEditorError: reportError,
      hidden: false,
      editorInitializationConfig: session.initialization,
      systemMode: EditorSystemMode.Edit,
      userMode: EditorUserMode.Edit,
      onEditorReadyToReceiveUpdates: onReady,
      onEditorLoadError: reportError,
      onUserModeChange: jest.fn(),
      setEditorRef,
      userAddress: 'local@example.test',
      isSuggestionsFeatureEnabled: false,
      showTreeView: false,
      tableOfContentsVisible: true,
    }
    function Tree() {
      return (
        <DocsDependenciesProvider dependencies={dependencies}>
          <DocsLayout.Container isSuggestionMode={false}>
            <StandaloneDocsEditor {...props} />
          </DocsLayout.Container>
        </DocsDependenciesProvider>
      )
    }
    const view = render(<Tree />)
    try {
      await waitFor(() => expect(ready).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(screen.getByTestId('main-editor')).toHaveTextContent('This document lives in memory'))
      expect(screen.getByTestId('main-editor')).toHaveAttribute('contenteditable', 'true')
      expect(screen.getByTestId('table-of-contents')).toHaveTextContent('Standalone Docs')
      expect(comments.getAllThreads).toHaveBeenCalled()
      expect(comments.subscribeToEvents).toHaveBeenCalled()
      expect(comments.subscribeToAwarenessStates).toHaveBeenCalled()
      await act(() => editor!.dispatchCommand(SHOW_ALL_COMMENTS_COMMAND, undefined))
      expect(await screen.findByText('A loaded comment')).toBeInTheDocument()
      expect(screen.getByTestId('comment-author')).toHaveTextContent('collaborator@example.test')
      expect(screen.getByText('Reply...')).toBeInTheDocument()

      jest.mocked(comments.getTypersExcludingSelf).mockResolvedValue(['Collaborator'])
      await act(async () => {
        eventListeners.forEach((callback) => callback({ type: 'typing', threadId: 'thread-id' }))
      })
      expect(await screen.findByTestId('info-active-typing')).toHaveTextContent('Collaborator is typing')

      const replacement = {
        ...comments,
        subscribeToEvents: jest.fn(() => jest.fn()),
        subscribeToAwarenessStates: jest.fn(() => jest.fn()),
      }
      const priorEvents = unsubscribeEvents.mock.calls.length
      const priorAwareness = unsubscribeAwareness.mock.calls.length
      dependencies = {
        ...dependencies,
        comments: replacement,
        canEdit: false,
        canComment: false,
        getDisplayNameForEmail: () => 'Updated contact',
      }
      await act(async () => view.rerender(<Tree />))
      await waitFor(() => expect(screen.getByTestId('comment-author')).toHaveTextContent('Updated contact'))
      expect(screen.queryByText('Reply...')).not.toBeInTheDocument()
      expect(unsubscribeEvents).toHaveBeenCalledTimes(priorEvents + 1)
      expect(unsubscribeAwareness).toHaveBeenCalledTimes(priorAwareness + 1)
      expect(replacement.subscribeToEvents).toHaveBeenCalled()
      expect(replacement.subscribeToAwarenessStates).toHaveBeenCalled()
      const clonedEditorState = editor!.getEditorState().clone()
      view.unmount()
      expect(replacement.subscribeToEvents.mock.results[0].value).toHaveBeenCalledTimes(1)
      expect(replacement.subscribeToAwarenessStates.mock.results[0].value).toHaveBeenCalledTimes(1)

      const preview = render(
        <DocsDependenciesProvider dependencies={dependencies}>
          <DocsLayout.Container isSuggestionMode={false}>
            <PreviewModeEditor
              clonedEditorState={clonedEditorState}
              role={role}
              onUserModeChange={jest.fn()}
              initialScrollTop={null}
              tableOfContentsVisible
              hidden={false}
            />
          </DocsLayout.Container>
        </DocsDependenciesProvider>,
      )
      await waitFor(() =>
        expect(screen.getByTestId('preview-mode-editor')).toHaveTextContent('This document lives in memory'),
      )
      expect(screen.getByTestId('preview-mode-editor')).toHaveAttribute('contenteditable', 'false')
      expect(screen.getByTestId('table-of-contents')).toHaveTextContent('Standalone Docs')
      jest.mocked(dependencies.reportToolbarInteraction).mockClear()
      fireEvent.click(within(preview.container).getByTestId('preview-mode-toolbar'))
      expect(dependencies.reportToolbarInteraction).not.toHaveBeenCalled()
      preview.unmount()
      expect(reportError).not.toHaveBeenCalled()
    } finally {
      view.unmount()
      session.destroy()
    }
  })
})
