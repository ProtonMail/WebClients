import { render, screen, waitFor } from '@testing-library/react'
import { TableOfContents } from './TableOfContents'

const mockScrollToHeading = jest.fn()
const mockHeading = Object.assign(document.createElement('h1'), { scrollIntoView: mockScrollToHeading })
const mockEditor = {
  read: (callback: () => void) => callback(),
  getElementByKey: () => mockHeading,
  getRootElement: () => null,
}

jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [mockEditor],
}))
jest.mock('@lexical/react/LexicalTableOfContentsPlugin', () => ({
  TableOfContentsPlugin: ({ children }: { children: (headings: [string, string, string][]) => React.ReactNode }) =>
    children([['heading-key', 'Fixture heading', 'h1']]),
}))
jest.mock('../../Containers/DocsLayout', () => ({
  DOCS_EDITOR_MAX_WIDTH: 816,
  useLeftPanelContext: () => ({ visibility: 'expanded', setVisibility: jest.fn() }),
}))

describe('TableOfContents heading links', () => {
  beforeEach(() => mockScrollToHeading.mockClear())

  it('waits for the editor to become visible before consuming a heading link', async () => {
    const getDocumentUrl = jest.fn(async () => 'https://docs.example.test/document?headingKey=heading-key')
    const replaceDocumentUrl = jest.fn(async () => {})
    const reportTelemetry = jest.fn()
    const props = { getDocumentUrl, replaceDocumentUrl, reportTelemetry }
    const { rerender } = render(<TableOfContents {...props} editorHidden />)
    await waitFor(() => expect(screen.getByTestId('table-of-contents-item-options')).not.toBeDisabled())
    expect(replaceDocumentUrl).not.toHaveBeenCalled()
    expect(mockScrollToHeading).not.toHaveBeenCalled()

    rerender(<TableOfContents {...props} editorHidden={false} />)
    await waitFor(() => expect(mockScrollToHeading).toHaveBeenCalledTimes(1))
    expect(replaceDocumentUrl).toHaveBeenCalledWith('https://docs.example.test/document')

    rerender(<TableOfContents {...props} editorHidden />)
    rerender(<TableOfContents {...props} editorHidden={false} />)
    expect(mockScrollToHeading).toHaveBeenCalledTimes(1)
    expect(replaceDocumentUrl).toHaveBeenCalledTimes(1)
  })

  it('handles a heading link when initially visible without a host state provider', async () => {
    const getDocumentUrl = jest.fn(async () => 'https://docs.example.test/document?headingKey=heading-key')
    const replaceDocumentUrl = jest.fn(async () => {})
    render(
      <TableOfContents
        getDocumentUrl={getDocumentUrl}
        replaceDocumentUrl={replaceDocumentUrl}
        reportTelemetry={jest.fn()}
        editorHidden={false}
      />,
    )
    await waitFor(() => expect(mockScrollToHeading).toHaveBeenCalledTimes(1))
    expect(replaceDocumentUrl).toHaveBeenCalledWith('https://docs.example.test/document')
  })
})
