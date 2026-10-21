import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { $getRoot, type LexicalEditor } from 'lexical'
import {
  CommentThreadStates,
  CommentThreadTypes,
  CommentTypes,
  DocsDependenciesProvider,
  DocsLayoutContainer,
  EditorSystemMode,
  EditorUserMode,
  StandaloneDocsEditor,
  type DocsCommentThread,
  type DocsDependencies,
  type DocsComments,
} from '../app/Containers/Docs/public'
import { PreviewModeEditor } from '../app/Containers/Docs/PreviewModeEditor'
import { SHOW_ALL_COMMENTS_COMMAND } from '../app/Containers/Docs/Commands'
import type { DocsCommentEvent } from '../app/Containers/Docs/contract/DocsComments'
import { polyfillSelectionRelatedThingsForTests } from '../app/Containers/Docs/Plugins/Suggestions/TestUtils'
import { createStandaloneDocClient } from './client'
import { createStandaloneDocSession } from './session'

/** Threads reach the editor as structured-cloned data, so the times are plain timestamps. */
function createThread(): DocsCommentThread {
  const createdAt = { serverTimestamp: Math.round(Date.now() / 1000) - 60 }
  return {
    id: 'thread-id',
    localID: 'thread-id',
    markID: 'mark-id',
    createTime: createdAt,
    state: CommentThreadStates.Active,
    type: CommentThreadTypes.Comment,
    isPlaceholder: false,
    comments: [
      {
        id: 'comment-id',
        createTime: createdAt,
        content: 'A loaded comment',
        author: 'collaborator@example.test',
        isPlaceholder: false,
        type: CommentTypes.Comment,
        verificationResult: { verified: true },
      },
    ],
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
    dateFormat: { localeCode: 'en-US', hourCycle: 'h12' },
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
    // JSDOM ranges have no layout, which Lexical reads to scroll a selection into view.
    polyfillSelectionRelatedThingsForTests()
  })
  it('mounts the full editing and preview editors with headings and loaded comments without shell providers', async () => {
    const reportError = jest.fn()
    const ready = jest.fn()
    const session = createStandaloneDocSession(ready, reportError)
    let editor: LexicalEditor | null = null
    const setEditorRef = (instance: LexicalEditor | null) => {
      editor = instance
    }
    const onReady = () => session.editorLoaded()
    const eventListeners = new Set<(event: DocsCommentEvent) => void>()
    const unsubscribeEvents = jest.fn()
    const unsubscribeAwareness = jest.fn()
    const comments = createStandaloneDocClient('local@example.test', session.subscribeToAwarenessStates)
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
          <DocsLayoutContainer isSuggestionMode={false}>
            <StandaloneDocsEditor {...props} />
          </DocsLayoutContainer>
        </DocsDependenciesProvider>
      )
    }
    const view = render(<Tree />)
    try {
      await waitFor(() => expect(ready).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(screen.getByTestId('main-editor')).toHaveTextContent('This document lives in memory'))
      expect(screen.getByTestId('main-editor')).toHaveAttribute('contenteditable', 'true')
      expect(session.docState.awareness.getLocalState()).toMatchObject({
        name: 'Local user',
        awarenessData: { userId: 'Local user' },
      })
      expect(screen.getByTestId('user-mode-dropdown')).toBeEnabled()
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
      dependencies = { ...dependencies, emojiPickerEnabled: true }
      await act(async () => view.rerender(<Tree />))
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
      dependencies = { ...dependencies, emojiPickerEnabled: false }
      await act(async () => view.rerender(<Tree />))
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()

      expect(screen.getByTestId('table-of-contents')).toHaveTextContent('Standalone Docs')
      expect(comments.getAllThreads).toHaveBeenCalled()
      expect(comments.subscribeToEvents).toHaveBeenCalled()
      expect(comments.subscribeToAwarenessStates).toHaveBeenCalled()
      await act(() => editor!.dispatchCommand(SHOW_ALL_COMMENTS_COMMAND, undefined))
      expect(await screen.findByText('A loaded comment')).toBeInTheDocument()
      expect(screen.getByTestId('comment-author')).toHaveTextContent('collaborator@example.test')
      expect(screen.getByTestId('comment-creation-time')).toHaveTextContent(/^1 min\. ago$/)
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
      expect(screen.getByTestId('user-mode-dropdown')).toBeDisabled()
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
          <DocsLayoutContainer isSuggestionMode={false}>
            <PreviewModeEditor
              clonedEditorState={clonedEditorState}
              onUserModeChange={jest.fn()}
              initialScrollTop={null}
              tableOfContentsVisible
              hidden={false}
            />
          </DocsLayoutContainer>
        </DocsDependenciesProvider>,
      )
      await waitFor(() =>
        expect(screen.getByTestId('preview-mode-editor')).toHaveTextContent('This document lives in memory'),
      )
      expect(screen.getByTestId('preview-mode-editor')).toHaveAttribute('contenteditable', 'false')
      expect(screen.getByTestId('preview-mode-editor').closest('.docs-editor-root')).not.toBeNull()
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

  it('renders the editor, its menus and its comments panel inside the Docs style scope', async () => {
    const reportError = jest.fn()
    const session = createStandaloneDocSession(jest.fn(), reportError)
    const comments = createStandaloneDocClient('local@example.test', session.subscribeToAwarenessStates)
    comments.getAllThreads = jest.fn(async () => [createThread()])
    let editor: LexicalEditor | null = null
    const view = render(
      <DocsDependenciesProvider dependencies={createDependencies(comments, reportError)}>
        <DocsLayoutContainer isSuggestionMode={false}>
          <StandaloneDocsEditor
            docMap={session.docMap}
            docState={session.docState}
            documentId={session.documentId}
            editingLocked={false}
            onEditorError={reportError}
            hidden={false}
            editorInitializationConfig={session.initialization}
            systemMode={EditorSystemMode.Edit}
            userMode={EditorUserMode.Edit}
            onEditorReadyToReceiveUpdates={() => session.editorLoaded()}
            onEditorLoadError={reportError}
            onUserModeChange={jest.fn()}
            setEditorRef={(instance) => {
              editor = instance
            }}
            userAddress="local@example.test"
            isSuggestionsFeatureEnabled={false}
            showTreeView={false}
            tableOfContentsVisible={false}
          />
        </DocsLayoutContainer>
      </DocsDependenciesProvider>,
    )
    try {
      const mainEditor = await screen.findByTestId('main-editor')
      expect(mainEditor.closest('.docs-editor-root')).not.toBeNull()

      fireEvent.click(screen.getByTestId('user-mode-dropdown'))
      expect((await screen.findByRole('menu')).closest('.docs-editor-portal-root')).not.toBeNull()

      await act(() => editor!.dispatchCommand(SHOW_ALL_COMMENTS_COMMAND, undefined))
      expect((await screen.findByText('A loaded comment')).closest('.docs-editor-root')).not.toBeNull()
      expect(reportError).not.toHaveBeenCalled()
    } finally {
      view.unmount()
      session.destroy()
    }
  })

  it('marks, lists and resolves a comment made through the in-memory comments client', async () => {
    const reportError = jest.fn()
    const session = createStandaloneDocSession(jest.fn(), reportError)
    const comments = createStandaloneDocClient('local@example.test', session.subscribeToAwarenessStates)
    let editor: LexicalEditor | null = null
    const view = render(
      <DocsDependenciesProvider dependencies={createDependencies(comments, reportError)}>
        <DocsLayoutContainer isSuggestionMode={false}>
          <StandaloneDocsEditor
            docMap={session.docMap}
            docState={session.docState}
            documentId={session.documentId}
            editingLocked={false}
            onEditorError={reportError}
            hidden={false}
            editorInitializationConfig={session.initialization}
            systemMode={EditorSystemMode.Edit}
            userMode={EditorUserMode.Edit}
            onEditorReadyToReceiveUpdates={() => session.editorLoaded()}
            onEditorLoadError={reportError}
            onUserModeChange={jest.fn()}
            setEditorRef={(instance) => {
              editor = instance
            }}
            userAddress="local@example.test"
            isSuggestionsFeatureEnabled={false}
            showTreeView={false}
            tableOfContentsVisible={false}
          />
        </DocsLayoutContainer>
      </DocsDependenciesProvider>,
    )
    try {
      const mainEditor = await screen.findByTestId('main-editor')
      await waitFor(() => expect(mainEditor).toHaveTextContent('This document lives in memory'))
      await act(async () => {
        editor!.update(
          () =>
            $getRoot()
              .getAllTextNodes()
              .find((text) => text.getTextContent().startsWith('This document'))!
              .select(0, 'This document'.length),
          { discrete: true },
        )
        await comments.createCommentThread('A new comment')
      })

      await waitFor(() => expect(mainEditor.querySelector('mark')).toHaveTextContent('This document'))
      await act(() => editor!.dispatchCommand(SHOW_ALL_COMMENTS_COMMAND, undefined))
      expect(await screen.findByText('A new comment')).toBeInTheDocument()

      const [thread] = await comments.getAllThreads()
      await act(() => comments.resolveThread(thread.id))
      await waitFor(() => expect(mainEditor.querySelector('mark')).toHaveClass('resolved'))
      expect(reportError).not.toHaveBeenCalled()
    } finally {
      view.unmount()
      session.destroy()
    }
  })
})
