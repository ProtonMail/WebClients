import '@testing-library/jest-dom'
import type { MemberRole, ProtonDriveClient } from '@protontech/drive-sdk'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DocumentActionsProvider } from '../DocumentActionsProvider'
import { HomepageViewContext, type HomepageViewValue } from '../homepageViewContext'
import { RecentDocumentsItem, type RecentDocumentsItemValue } from '../recentDocumentsItem'
import { DateFormatter } from '../utils/dateFormatter'
import { ServerTime } from '../utils/serverTime'
import { HomepageContent } from './HomepageContent'

jest.mock('../utils/useIsNarrow', () => ({ useIsNarrow: () => false }))

function createDocument(value: Partial<RecentDocumentsItemValue>) {
  return RecentDocumentsItem.create({
    type: 'document',
    name: 'Plan',
    linkId: 'link1',
    parentLinkId: 'parent1',
    volumeId: 'volume1',
    lastViewed: new ServerTime(Date.now()),
    lastModified: new ServerTime(Date.now()),
    createdBy: 'me@example.com',
    location: { type: 'root' },
    isSharedWithMe: false,
    shareId: 'share1',
    effectiveRole: 'admin' as MemberRole,
    ...value,
  })
}

function renderTable(documents: RecentDocumentsItem[], { bulkTrash = false } = {}) {
  const renameNode = jest.fn()
  const drive = { renameNode } as unknown as ProtonDriveClient
  const value = {
    state: { view: 'recents', sort: 'name', itemSections: [{ id: 'name', items: documents }] },
    type: undefined,
    updateRenamedDocumentInCache: jest.fn(),
    pendingInvitations: [],
    recentlyAcceptedInvitations: [],
    reportTelemetry: jest.fn(),
    logger: { debug: jest.fn(), error: jest.fn() },
    createNotification: jest.fn(),
    getAppHref: (path: string) => path,
    dateFormatter: new DateFormatter({ localeCode: 'en-US', hourCycle: 'h12' }),
    errorTracking: { traceError: jest.fn(), addBreadcrumb: jest.fn(), isReportable: () => true },
    featureFlags: { bulkTrash, bulkMove: false },
    addresses: [],
    contactEmails: [],
  } as unknown as HomepageViewValue

  render(
    <HomepageViewContext.Provider value={value}>
      <DocumentActionsProvider drive={drive} openShareModal={jest.fn()} openMoveItemsModal={jest.fn()}>
        <HomepageContent />
      </DocumentActionsProvider>
    </HomepageViewContext.Provider>,
  )
  return { renameNode, ...value }
}

function getRow(name: string) {
  return screen.getByText(name, { selector: 'span' }).closest<HTMLElement>('[role="row"]')!
}

async function startRename(name: string) {
  const row = getRow(name)
  const actions = within(row).getByRole('button', { name: 'Actions' })
  act(() => actions.focus())
  await userEvent.keyboard('{Enter}')
  await userEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Rename' }))
  return screen.findByRole('textbox')
}

/** Starts renaming and empties the name box. Browsers focus it as the table selects its text; jsdom's `select` doesn't. */
async function startRenameAndClear(name: string) {
  const input = await startRename(name)
  await userEvent.clear(input)
  return input
}

describe('DocumentsTable rename', () => {
  // JSDOM has no layout; Ariakit checks visibility before it moves focus.
  beforeEach(() => jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1))
  afterEach(() => jest.restoreAllMocks())

  test('renames a document, with the keys that move in the name left to the name box', async () => {
    const { renameNode, updateRenamedDocumentInCache, createNotification } = renderTable(
      [createDocument({ name: 'Plan' }), createDocument({ name: 'Budget', linkId: 'link2' })],
      { bulkTrash: true },
    )
    await startRenameAndClear('Plan')

    await userEvent.keyboard('Q3 plan{Home}Draft {End}{ArrowDown}{Enter}')

    expect(renameNode).toHaveBeenCalledWith('volume1~link1', 'Draft Q3 plan')
    await waitFor(() => expect(updateRenamedDocumentInCache).toHaveBeenCalledWith('volume1-link1', 'Draft Q3 plan'))
    expect(createNotification).toHaveBeenCalledWith({ text: expect.anything() })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  test('a failed rename says so, keeps the old name, and the document can be renamed again', async () => {
    const { renameNode, updateRenamedDocumentInCache, createNotification } = renderTable([createDocument({})])
    renameNode.mockRejectedValueOnce(new Error('Name taken'))
    await startRenameAndClear('Plan')

    await userEvent.keyboard('Budget{Enter}')

    await waitFor(() =>
      expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Failed to rename document' }),
    )
    expect(updateRenamedDocumentInCache).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(getRow('Plan')).toBeInTheDocument()

    expect(await startRename('Plan')).toBeEnabled()
  })

  test('Escape gives the new name up', async () => {
    const { renameNode } = renderTable([createDocument({})])
    await startRenameAndClear('Plan')

    await userEvent.keyboard('Budget{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(getRow('Plan')).toBeInTheDocument()
    expect(renameNode).not.toHaveBeenCalled()
  })

  test('only the document being renamed shows a name box, even when another volume has the same link ID', async () => {
    renderTable([createDocument({ name: 'Plan' }), createDocument({ name: 'Copy of plan', volumeId: 'volume2' })])

    await startRename('Plan')

    expect(screen.getAllByRole('textbox')).toHaveLength(1)
  })
})
