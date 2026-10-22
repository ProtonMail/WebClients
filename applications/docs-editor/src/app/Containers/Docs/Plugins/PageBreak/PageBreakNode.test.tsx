import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { act, render } from '@testing-library/react'
import type { LexicalEditor } from 'lexical'
import { $getRoot } from 'lexical'
import { AllNodes } from '../../AllNodes'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { $createPageBreakNode } from './PageBreakNode'

let editor: LexicalEditor
function CaptureEditor() {
  ;[editor] = useLexicalComposerContext()
  return null
}

function withPageBreakLabel(label: string) {
  return { ...defaultDocsMessages, pageBreak: { label } }
}

function DocumentWithPageBreak({ label }: { label: string }) {
  return (
    <DocsDependenciesProvider dependencies={{ messages: withPageBreakLabel(label) } as DocsDependencies}>
      <LexicalComposer
        initialConfig={{
          namespace: 'page-break-test',
          nodes: AllNodes,
          onError: (error) => {
            throw error
          },
        }}
      >
        <RichTextPlugin
          contentEditable={<ContentEditable aria-label="Document" />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <CaptureEditor />
      </LexicalComposer>
    </DocsDependenciesProvider>
  )
}

function pageBreakElement() {
  return editor.getRootElement()!.querySelector<HTMLElement>('[data-lexical-page-break="true"]')!
}

it('labels the page break in the host language and follows a locale change', async () => {
  const { rerender } = render(<DocumentWithPageBreak label="Saut de page" />)
  await act(async () => {
    editor.update(() => {
      $getRoot().clear().append($createPageBreakNode())
    })
  })

  expect(pageBreakElement()).toHaveAttribute('aria-label', 'Saut de page')
  expect(pageBreakElement()).toHaveAttribute('data-label', 'Saut de page')

  rerender(<DocumentWithPageBreak label="Seitenumbruch" />)

  expect(pageBreakElement()).toHaveAttribute('aria-label', 'Seitenumbruch')
  expect(pageBreakElement()).toHaveAttribute('data-label', 'Seitenumbruch')
})
