import { SafeLexicalComposer } from '../Tools/SafeLexicalComposer'
import { BuildInitialEditorConfig } from '../Lib/InitialEditorConfig'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import clsx from '@proton/utils/clsx'
import { ProtonContentEditable } from '../ContentEditable/ProtonContentEditable'
import { DefaultFont } from '../Shared/Fonts'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { EditorSystemMode, type DocumentRole } from '@proton/docs-shared'
import type { MouseEventHandler } from 'react'
import { useCallback, useEffect } from 'react'
import Toolbar from '../Toolbar/Toolbar'
import { EditorUserMode } from '../Lib/EditorUserMode'
import type { EditorState } from 'lexical'
import { $unwrapAllCommentThreadMarks } from '../Tools/removeCommentThreadMarks'
import { $rejectAllSuggestions } from '../Plugins/Suggestions/rejectAllSuggestions'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { setScrollableTablesActive } from '@lexical/table'
import { isHTMLElement } from '../Utils/guard'

export function PreviewModeEditor({
  clonedEditorState,
  role,
  onUserModeChange,
  clientInvoker,
}: {
  clonedEditorState: EditorState
  role: DocumentRole
  onUserModeChange: (mode: EditorUserMode) => void
  clientInvoker: EditorRequiresClientMethods
}) {
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
      key={Math.random()}
    >
      <Toolbar
        hasEditAccess={role.canEdit()}
        userMode={EditorUserMode.Preview}
        onUserModeChange={onUserModeChange}
        isPreviewModeToolbar
        systemMode={EditorSystemMode.PublicView}
      />
      <RichTextPlugin
        contentEditable={
          <div
            className="relative overflow-auto"
            style={{
              gridColumn: '1 / 3',
              gridRow: '2',

              display: 'grid',
              gridTemplateRows: '1fr',
            }}
          >
            <ProtonContentEditable
              className={clsx(
                'DocumentEditor w-[80%] max-w-[80%] lg:w-[816px] lg:max-w-[816px] print:w-full print:max-w-full',
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
          </div>
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <PreviewCleanupPlugin />
    </SafeLexicalComposer>
  )
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
