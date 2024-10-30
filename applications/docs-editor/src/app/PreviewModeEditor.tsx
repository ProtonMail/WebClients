import { SafeLexicalComposer } from './Tools/SafeLexicalComposer'
import { BuildInitialEditorConfig } from './InitialEditorConfig'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import clsx from '@proton/utils/clsx'
import { ProtonContentEditable } from './ContentEditable/ProtonContentEditable'
import { DefaultFont } from './Shared/Fonts'
import type { DocumentRole } from '@proton/docs-shared'
import { useEffect } from 'react'
import Toolbar from './Toolbar/Toolbar'
import { EditorUserMode } from './EditorUserMode'
import type { EditorState } from 'lexical'
import { $unwrapAllCommentThreadMarks } from './Tools/removeCommentThreadMarks'
import { $rejectAllSuggestions } from './Plugins/Suggestions/rejectAllSuggestions'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export function PreviewModeEditor({
  clonedEditorState,
  role,
  onUserModeChange,
}: {
  clonedEditorState: EditorState
  role: DocumentRole
  onUserModeChange: (mode: EditorUserMode) => void
}) {
  return (
    <SafeLexicalComposer
      initialConfig={BuildInitialEditorConfig({
        onError: console.error,
        editorState: clonedEditorState,
      })}
      key={Math.random()}
    >
      <Toolbar
        hasEditAccess={role.canEdit()}
        userMode={EditorUserMode.Preview}
        onUserModeChange={onUserModeChange}
        isPreviewModeToolbar
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
                // eslint-disable-next-line custom-rules/deprecate-classes
                justifySelf: 'center',
              }}
              isSuggestionMode={false}
              data-testid="preview-mode-editor"
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
