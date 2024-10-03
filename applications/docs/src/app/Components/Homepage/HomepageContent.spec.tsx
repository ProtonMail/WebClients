import { type ReactNode, useEffect, useState } from 'react'
import '@testing-library/jest-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RecentDocumentsSnapshot, RecentDocumentsSnapshotData } from '@proton/docs-core'
import { HomepageContent } from './HomepageContent'
import { RecentDocumentsContext } from './useRecentDocuments'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

const MOCK_DATA = [
  {
    name: 'Document1',
    linkId: 'link1',
    volumeId: 'volume1',
    location: ['location', 'Document1'],
    lastViewed: 1,
    createdBy: 'Creator',
    parentLinkId: 'parentLink1',
  },
  {
    name: 'Test Document',
    linkId: 'link2',
    volumeId: 'volume1',
    location: ['location', 'Document1'],
    lastViewed: 1,
    createdBy: 'Creator',
    parentLinkId: 'parentLink1',
  },
  {
    name: 'Test Doc',
    linkId: 'link3',
    volumeId: 'volume1',
    location: ['location', 'Document1'],
    lastViewed: 1,
    createdBy: 'Creator',
    parentLinkId: 'parentLink1',
  },
]

test('Show loading spinner whilst fetching', async () => {
  renderWithProvider(<HomepageContent />, 'delayed')
  await screen.findByText(/Loading/)
})

test('Show recent document table when results are fetched', async () => {
  renderWithProvider(<HomepageContent />)
  const table = await screen.findByRole('table')
  // first rowgroup is for the thread second is for tbody
  const tbody = within(table).getAllByRole('rowgroup')[1]
  const rows = within(tbody).getAllByRole('button', { name: 'Open' })
  rows.forEach((row, i) => {
    checkRowContents(
      row,
      MOCK_DATA[i].name,
      '' + MOCK_DATA[i].lastViewed,
      MOCK_DATA[i].createdBy,
      MOCK_DATA[i].location[0],
    )
  })
})

test('Show no items found message when results are empty', async () => {
  renderWithProvider(<HomepageContent />, 'empty_recents')
  await screen.findByText(/Create your end-to-end encrypted document/)
})

test('Show context menu when button is clicked', async () => {
  renderWithProvider(<HomepageContent />)
  await userEvent.click(screen.getAllByRole('button', { name: /Context menu/ })[0])
  await screen.findByText('Open')
  await screen.findByText('Open folder')
})

test('Navigate to the parent drive folder when "Open Folder" is clicked', async () => {
  const { mockHandleOpenFolder } = renderWithProvider(<HomepageContent />)
  await userEvent.click(screen.getAllByRole('button', { name: /Context menu/ })[0])
  await userEvent.click(await screen.findByText('Open folder'))
  expect(mockHandleOpenFolder).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]))
})

test('Navigate to the document editor when "Open" is clicked', async () => {
  const { mockHandleOpenDocument } = renderWithProvider(<HomepageContent />)
  await userEvent.click(screen.getAllByRole('button', { name: /Context menu/ })[0])
  await userEvent.click(await screen.findByText('Open'))
  expect(mockHandleOpenDocument).toHaveBeenCalledWith(expect.objectContaining(MOCK_DATA[0]))
})

const RecentDocumentsMockProvider = ({
  children,
  flow,
  handleTrashDocument,
  handleOpenDocument,
  handleOpenFolder,
}: {
  children: ReactNode
  flow: 'one_document' | 'empty_recents' | 'delayed'
  handleTrashDocument: jest.Mock
  handleOpenDocument: jest.Mock
  handleOpenFolder: jest.Mock
}) => {
  let [snapshot, setSnapshot] = useState<RecentDocumentsSnapshot>({ state: 'not_fetched' })

  let providerValue = {
    state: snapshot,
    items: snapshot.data || [],
    handleTrashDocument,
    handleOpenDocument,
    handleOpenFolder,
    getDisplayName: (recentDocument: RecentDocumentsSnapshotData) => recentDocument.createdBy,
    getDisplayDate: (recentDocument: RecentDocumentsSnapshotData) => '' + recentDocument.lastViewed,
  }

  useEffect(() => {
    if (flow === 'one_document') {
      setSnapshot({
        state: 'fetched',
        data: MOCK_DATA,
      })
    }

    if (flow === 'empty_recents') {
      setSnapshot({ state: 'fetched', data: [] })
    }

    if (flow === 'delayed') {
      setSnapshot({ state: 'fetching' })
      setTimeout(() => {
        setSnapshot({ state: 'fetched', data: [] })
      }, 10)
    }
  }, [])

  return <RecentDocumentsContext.Provider value={providerValue}>{children}</RecentDocumentsContext.Provider>
}

function renderWithProvider(node: ReactNode, flow: 'one_document' | 'empty_recents' | 'delayed' = 'one_document') {
  const mockHandleTrashDocument = jest.fn()
  const mockHandleOpenDocument = jest.fn()
  const mockHandleOpenFolder = jest.fn()
  render(
    <RecentDocumentsMockProvider
      flow={flow}
      handleOpenDocument={mockHandleOpenDocument}
      handleOpenFolder={mockHandleOpenFolder}
      handleTrashDocument={mockHandleTrashDocument}
    >
      {node}
    </RecentDocumentsMockProvider>,
  )
  return { mockHandleOpenDocument, mockHandleOpenFolder, mockHandleTrashDocument }
}

const checkRowContents = (
  row: HTMLElement,
  documentName: string,
  lastRead: string,
  createdBy: string,
  location: string,
) => {
  const columns = within(row).getAllByRole('cell')
  expect(columns).toHaveLength(4)
  expect(columns[0]).toHaveTextContent(documentName)
  expect(columns[1]).toHaveTextContent(lastRead)
  expect(columns[2]).toHaveTextContent(createdBy)
  expect(columns[3]).toHaveTextContent(location)
}

afterEach(cleanup)
