import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { DocsDependenciesProvider, type DocsDependencies } from '../../DocsDependenciesProvider'
import { DocsLayoutContainer, DocsLayoutGrid } from '../../Layout/DocsLayout'
import { defaultDocsMessages } from '../../messages/defaultDocsMessages'
import { TableOfContentsPlugin } from './TableOfContentsPlugin'

const mockScrollToHeading = jest.fn()
let secondHeadingTop = 500
const mockHeadings: Record<string, HTMLElement> = {
  'first-key': Object.assign(document.createElement('h1'), {
    scrollIntoView: mockScrollToHeading,
    getBoundingClientRect: () => ({ top: 0 }) as DOMRect,
  }),
  'second-key': Object.assign(document.createElement('h2'), {
    scrollIntoView: mockScrollToHeading,
    getBoundingClientRect: () => ({ top: secondHeadingTop }) as DOMRect,
  }),
}
const mockEditor = {
  read: (callback: () => void) => callback(),
  getElementByKey: (key: string) => mockHeadings[key] ?? null,
  getRootElement: () => document.querySelector<HTMLElement>('.fixture-editor-root'),
}

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}))
jest.mock('@lexical/react/LexicalTableOfContentsPlugin', () => ({
  TableOfContentsPlugin: ({ children }: { children: (headings: [string, string, string][]) => React.ReactNode }) =>
    children([
      ['first-key', 'First heading', 'h1'],
      ['second-key', 'Second heading', 'h2'],
    ]),
}))

type HostCallbacks = Pick<DocsDependencies, 'getDocumentUrl' | 'replaceDocumentUrl' | 'reportTelemetry'>

function DocsLayout({ children, host }: { children: ReactNode; host: HostCallbacks }) {
  return (
    <DocsDependenciesProvider dependencies={{ defaultMessages: defaultDocsMessages, ...host } as DocsDependencies}>
      <DocsLayoutContainer isSuggestionMode={false}>
        <DocsLayoutGrid leftPanelEnabled>
          {children}
          <div className="fixture-editor-root" />
        </DocsLayoutGrid>
      </DocsLayoutContainer>
    </DocsDependenciesProvider>
  )
}

function createHost(documentUrl = 'https://docs.example.test/document') {
  return {
    getDocumentUrl: jest.fn(async () => documentUrl),
    replaceDocumentUrl: jest.fn(async () => {}),
    reportTelemetry: jest.fn(),
  }
}

async function renderTableOfContents(host: HostCallbacks, editorHidden = false) {
  const result = render(<TableOfContentsPlugin editorHidden={editorHidden} />, {
    wrapper: ({ children }) => <DocsLayout host={host}>{children}</DocsLayout>,
  })
  await waitFor(() => expect(screen.getAllByTestId('table-of-contents-item-options')[0]).toBeEnabled())
  return result
}

beforeEach(() => {
  mockScrollToHeading.mockClear()
  secondHeadingTop = 500
  localStorage.clear()
})

describe('TableOfContentsPlugin heading links', () => {
  it('waits for the editor to become visible before consuming a heading link', async () => {
    const host = createHost('https://docs.example.test/document?headingKey=first-key')
    const { rerender } = await renderTableOfContents(host, true)
    expect(host.replaceDocumentUrl).not.toHaveBeenCalled()
    expect(mockScrollToHeading).not.toHaveBeenCalled()

    rerender(<TableOfContentsPlugin editorHidden={false} />)
    await waitFor(() => expect(mockScrollToHeading).toHaveBeenCalledTimes(1))
    expect(host.replaceDocumentUrl).toHaveBeenCalledWith('https://docs.example.test/document')

    rerender(<TableOfContentsPlugin editorHidden />)
    rerender(<TableOfContentsPlugin editorHidden={false} />)
    expect(mockScrollToHeading).toHaveBeenCalledTimes(1)
    expect(host.replaceDocumentUrl).toHaveBeenCalledTimes(1)
  })

  it('handles a heading link when initially visible', async () => {
    const host = createHost('https://docs.example.test/document?headingKey=first-key')
    await renderTableOfContents(host)
    await waitFor(() => expect(mockScrollToHeading).toHaveBeenCalledTimes(1))
    expect(host.replaceDocumentUrl).toHaveBeenCalledWith('https://docs.example.test/document')
  })

  it('copies a link to a heading from its options menu', async () => {
    const writeText = jest.fn(async () => {})
    Object.assign(navigator, { clipboard: { writeText } })
    await renderTableOfContents(createHost())

    fireEvent.click(screen.getAllByRole('button', { name: 'More options' })[0])
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy link' }))

    expect(writeText).toHaveBeenCalledWith('https://docs.example.test/document?headingKey=first-key')
  })
})

describe('TableOfContentsPlugin outline', () => {
  it('is a navigation landmark whose toggle opens it and reports telemetry', async () => {
    const host = createHost()
    await renderTableOfContents(host)

    const outline = screen.getByRole('navigation', { name: 'Outline' })
    const toggle = within(outline).getByRole('button', { name: 'Open outline' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(host.reportTelemetry).toHaveBeenCalledWith('table_of_contents.available')

    fireEvent.click(toggle)

    expect(toggle).toHaveAccessibleName('Close outline')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(host.reportTelemetry).toHaveBeenCalledWith('table_of_contents.opened')
  })

  it('lists headings as links and marks the heading in view as the current location', async () => {
    await renderTableOfContents(createHost())

    const first = screen.getByRole('link', { name: 'First heading' })
    const second = screen.getByRole('link', { name: 'Second heading' })
    expect(first).toHaveAttribute('href', 'https://docs.example.test/document?headingKey=first-key')
    expect(first).toHaveAttribute('aria-current', 'location')
    expect(second).not.toHaveAttribute('aria-current')

    secondHeadingTop = 10
    fireEvent.scroll(document.querySelector('.docs-layout-grid')!)

    expect(second).toHaveAttribute('aria-current', 'location')
    expect(first).not.toHaveAttribute('aria-current')
  })

  it('scrolls to a clicked heading in place and reports the click', async () => {
    const host = createHost()
    await renderTableOfContents(host)

    const navigated = fireEvent.click(screen.getByRole('link', { name: 'Second heading' }))

    expect(navigated).toBe(false)
    expect(mockScrollToHeading).toHaveBeenCalledTimes(1)
    expect(host.reportTelemetry).toHaveBeenCalledWith('table_of_contents.heading_clicked')
  })

  it('shows the NEW badge until the outline is first toggled', async () => {
    await renderTableOfContents(createHost())
    expect(screen.getByText('NEW')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open outline' }))

    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
    expect(localStorage.getItem('docs-toc-new-tag')).toBe('true')
  })

  it('keeps the NEW badge hidden for users who dismissed it before', async () => {
    localStorage.setItem('docs-toc-new-tag', 'true')
    await renderTableOfContents(createHost())

    expect(screen.queryByText('NEW')).not.toBeInTheDocument()
  })
})
