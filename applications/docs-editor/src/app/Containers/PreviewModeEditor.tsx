import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { MouseEventHandler } from 'react'
import { SafeLexicalComposer } from '../Tools/SafeLexicalComposer'
import { BuildInitialEditorConfig } from '../Lib/InitialEditorConfig'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import clsx from '@proton/utils/clsx'
import { ProtonContentEditable } from '../ContentEditable/ProtonContentEditable'
import { DefaultFont } from '../Shared/Fonts'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { EditorSystemMode, type DocumentRole } from '@proton/docs-shared'
import Toolbar from '../Toolbar/Toolbar'
import { EditorUserMode } from '../Lib/EditorUserMode'
import type { EditorState } from 'lexical'
import { $unwrapAllCommentThreadMarks } from '../Tools/removeCommentThreadMarks'
import { $rejectAllSuggestions } from '../Plugins/Suggestions/rejectAllSuggestions'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { setScrollableTablesActive } from '@lexical/table'
import { isHTMLElement } from '../Utils/guard'
import { TableOfContents } from '../Components/TableOfContents'
import DocsLayout from './DocsLayout'
import { useIsAlpha } from '../Hooks/useIsAlpha'

export function PreviewModeEditor({
  clonedEditorState,
  role,
  onUserModeChange,
  clientInvoker,
  initialScrollTop,
}: {
  clonedEditorState: EditorState
  role: DocumentRole
  onUserModeChange: (mode: EditorUserMode) => void
  clientInvoker: EditorRequiresClientMethods
  initialScrollTop: number | null
}) {
  const isAlpha = useIsAlpha()

  const handlePreviewModeLinkClick: MouseEventHandler = useCallback(
    (event) => {
      const target = event.target
      if (!isHTMLElement(target)) {
        return
      }
      const parentLink = target.closest('a')
      if (!parentLink) {
        return
      }
      event.preventDefault()
      const link = parentLink.href
      clientInvoker.openLink(link).catch(console.error)
    },
    [clientInvoker],
  )

  const getDocumentUrl = useMemo(() => clientInvoker.getDocumentUrl.bind(clientInvoker), [clientInvoker])
  const replaceDocumentUrl = useMemo(() => clientInvoker.replaceDocumentUrl.bind(clientInvoker), [clientInvoker])

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
      <DocsLayout.Grid>
        {isAlpha && (
          <DocsLayout.LeftPanel>
            <TableOfContents getDocumentUrl={getDocumentUrl} replaceDocumentUrl={replaceDocumentUrl} />
          </DocsLayout.LeftPanel>
        )}
        <RichTextPlugin
          contentEditable={
            <DocsLayout.RightPanel>
              <ProtonContentEditable
                className={clsx(
                  'DocumentEditor w-full max-w-full overflow-x-hidden px-[10%] lg:w-full lg:max-w-full lg:pl-4 lg:pr-[var(--right-panel-padding)] print:w-full print:max-w-full',
                )}
                style={{
                  fontFamily: DefaultFont.value,
                  gridRow: 1,
                  gridColumn: 1,
                  justifySelf: 'center',
                }}
                isSuggestionMode={false}
                data-testid="preview-mode-editor"
                onClick={handlePreviewModeLinkClick}
              />
            </DocsLayout.RightPanel>
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </DocsLayout.Grid>

      <PreviewStateSyncPlugin clonedEditorState={clonedEditorState} />
      <PreviewScrollRestorePlugin initialScrollTop={initialScrollTop} />
      <PreviewCleanupPlugin />
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

    const scrollContainer = previewEditor.getRootElement()?.parentElement
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
