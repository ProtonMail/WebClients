import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { SafeLexicalComposer } from '../Tools/SafeLexicalComposer'
import { BuildInitialEditorConfig } from '../Lib/InitialEditorConfig'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ProtonContentEditable } from '../ContentEditable/ProtonContentEditable'
import { DefaultFont } from '../Shared/Fonts'
import type { DocumentRole, EditorRequiresClientMethods } from '@proton/docs-shared'
import { EditorSystemMode } from '@proton/docs-shared'
import type { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'
import Toolbar from '../Toolbar/Toolbar'
import { EditorUserMode } from '../Lib/EditorUserMode'
import type { EditorState } from 'lexical'
import { $unwrapAllCommentThreadMarks } from '../Tools/removeCommentThreadMarks'
import { $rejectAllSuggestions } from '../Plugins/Suggestions/rejectAllSuggestions'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { setScrollableTablesActive } from '@lexical/table'
import { TableOfContents } from '../Components/TableOfContents/TableOfContents'
import DocsLayout from './DocsLayout'
import { getDocsLayoutScrollContainer } from './docsLayoutUtils'
import { ReadonlyLinkFixPlugin } from '../Plugins/Link/ReadonlyLinkFixPlugin'
import { useDocsDependencies } from './Docs/DocsDependenciesProvider'

interface PreviewModeEditorProps {
  clonedEditorState: EditorState
  role: DocumentRole
  onUserModeChange: (mode: EditorUserMode) => void
  clientInvoker: EditorRequiresClientMethods
  initialScrollTop: number | null
  tableOfContentsVisible: boolean
}

export function PreviewModeEditor({
  clonedEditorState,
  role,
  onUserModeChange,
  clientInvoker,
  initialScrollTop,
  tableOfContentsVisible,
}: PreviewModeEditorProps) {
  const getDocumentUrl = useMemo(() => clientInvoker.getDocumentUrl.bind(clientInvoker), [clientInvoker])
  const replaceDocumentUrl = useMemo(() => clientInvoker.replaceDocumentUrl.bind(clientInvoker), [clientInvoker])
  const reportTelemetry = useCallback(
    (event: TelemetryDocsEditorEvents) => {
      void clientInvoker.editorReportingTelemetry(event)
    },
    [clientInvoker],
  )
  const { openLink } = useDocsDependencies()

  return (
    <SafeLexicalComposer
      initialConfig={BuildInitialEditorConfig({
        onError: console.error,
        editorState: (editor) => {
          /**
           * Required to add this before the table nodes are created
           * since the table wrapper is only added if this is enabled
           * before the `createDOM` method for a table node is run.
           */
          setScrollableTablesActive(editor, true)
          editor.setEditorState(clonedEditorState)
        },
      })}
    >
      <Toolbar
        hasEditAccess={role.canEdit()}
        userMode={EditorUserMode.Preview}
        onUserModeChange={onUserModeChange}
        isPreviewModeToolbar
        systemMode={EditorSystemMode.PublicView}
      />
      <DocsLayout.Grid leftPanelEnabled={tableOfContentsVisible}>
        <DocsLayout.LeftPanel>
          {tableOfContentsVisible && (
            <TableOfContents
              getDocumentUrl={getDocumentUrl}
              replaceDocumentUrl={replaceDocumentUrl}
              reportTelemetry={reportTelemetry}
            />
          )}
        </DocsLayout.LeftPanel>
        <DocsLayout.CenterPanel>
          <RichTextPlugin
            contentEditable={
              <ProtonContentEditable
                className="DocumentEditor w-full max-w-full print:w-full print:max-w-full"
                style={{
                  fontFamily: DefaultFont.value,
                  gridRow: 1,
                  gridColumn: 1,
                }}
                isSuggestionMode={false}
                data-testid="preview-mode-editor"
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </DocsLayout.CenterPanel>
        <DocsLayout.RightPanel />
      </DocsLayout.Grid>

      <PreviewStateSyncPlugin clonedEditorState={clonedEditorState} />
      <PreviewScrollRestorePlugin initialScrollTop={initialScrollTop} />
      <PreviewCleanupPlugin />
      <ReadonlyLinkFixPlugin openLink={openLink} />
    </SafeLexicalComposer>
  )
}

function PreviewScrollRestorePlugin({ initialScrollTop }: { initialScrollTop: number | null }) {
  const [previewEditor] = useLexicalComposerContext()
  const hasRestoredScroll = useRef(false)

  useLayoutEffect(() => {
    if (initialScrollTop === null || hasRestoredScroll.current) {
      return
    }

    const scrollContainer = getDocsLayoutScrollContainer(previewEditor.getRootElement())
    if (!scrollContainer) {
      return
    }

    scrollContainer.scrollTop = initialScrollTop
    hasRestoredScroll.current = true
  }, [initialScrollTop, previewEditor])

  return null
}

function PreviewStateSyncPlugin({ clonedEditorState }: { clonedEditorState: EditorState }) {
  const [previewEditor] = useLexicalComposerContext()
  const hasAppliedInitialState = useRef(false)

  useEffect(() => {
    // The initial clonedEditorState is applied once via the composer's
    // initialConfig.editorState callback (so it runs before table nodes are
    // created, for setScrollableTablesActive). Skip the first effect run to
    // avoid redundantly replacing the state we just set.
    if (!hasAppliedInitialState.current) {
      hasAppliedInitialState.current = true
      return
    }
    // setEditorState uses flushSync internally; defer to a microtask so we
    // don't call it during React's render/commit phase.
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) {
        return
      }
      previewEditor.setEditorState(clonedEditorState)
    })
    return () => {
      cancelled = true
    }
  }, [previewEditor, clonedEditorState])

  return null
}

function PreviewCleanupPlugin() {
  const [previewEditor] = useLexicalComposerContext()

  useEffect(() => {
    const cleanup = () =>
      previewEditor.update(() => {
        $rejectAllSuggestions()
        $unwrapAllCommentThreadMarks()
      })

    cleanup()

    return previewEditor.registerUpdateListener(() => {
      cleanup()
    })
  }, [previewEditor])

  return null
}
