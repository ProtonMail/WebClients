import { act, render, screen } from '@testing-library/react'
import type { LexicalEditor } from 'lexical'
import type { PropsWithChildren } from 'react'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { DocsPresentationProvider } from '../../DocsPresentationProvider'
import { EditorUserMode } from '../../contract/EditorUserMode'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { FloatingQuickActions } from './FloatingQuickActions'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

function EditorProviders({ children }: PropsWithChildren) {
  return (
    <DocsDependenciesProvider
      dependencies={{ suggestionsEnabled: false, defaultMessages: defaultDocsMessages } as DocsDependencies}
    >
      <DocsPresentationProvider userMode={EditorUserMode.Edit}>{children}</DocsPresentationProvider>
    </DocsDependenciesProvider>
  )
}

function renderQuickActions() {
  const editorElement = document.createElement('div')
  const editor = {
    getRootElement: () => editorElement,
    getElementByKey: () => editorElement,
    dispatchCommand: jest.fn(),
  } as unknown as LexicalEditor

  const { container } = render(<FloatingQuickActions anchorKey="anchor" editor={editor} onAddComment={jest.fn()} />, {
    wrapper: EditorProviders,
  })

  expect(screen.getByRole('button', { name: 'Add comment' })).toBeInTheDocument()
  return container.firstElementChild as HTMLElement
}

const initialViewportWidth = window.innerWidth
afterEach(() => setViewportWidth(initialViewportWidth))

it('sits 5px from the right edge on a viewport of 680px or less', () => {
  setViewportWidth(680)

  const quickActions = renderQuickActions()

  expect(quickActions.style.right).toBe('5px')
  expect(quickActions.style.left).toBe('')
})

it('moves beside the editor when the viewport grows past 680px', () => {
  setViewportWidth(500)
  const quickActions = renderQuickActions()

  act(() => {
    setViewportWidth(681)
    window.dispatchEvent(new Event('resize'))
  })

  expect(quickActions.style.right).toBe('')
  expect(quickActions.style.left).toBe('10px')
})
