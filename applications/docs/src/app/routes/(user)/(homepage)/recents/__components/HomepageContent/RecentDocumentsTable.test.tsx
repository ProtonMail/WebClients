import '@testing-library/jest-dom'
import type { ItemSectionId } from './RecentDocumentsTable'
import { getOwnerName, splitIntoSections } from './RecentDocumentsTable'
import { ServerTime } from '@proton/docs-shared'
import { RecentDocumentsItem } from '@proton/docs-core'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

function createRecentDocumentsItem({
  name,
  lastViewed,
  lastModified,
}: {
  name: string
  lastViewed: Date
  lastModified: Date
}) {
  return RecentDocumentsItem.create({
    name,
    linkId: '',
    parentLinkId: '',
    volumeId: '',
    lastViewed: new ServerTime(lastViewed.getTime()),
    lastModified: new ServerTime(lastModified.getTime()),
    createdBy: '',
    location: { type: 'root' },
    isSharedWithMe: false,
    shareId: '',
  })
}

function createDate(daysAgo: number, hour = 0, minute = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date
}

const MOCK_DATES: Partial<Record<ItemSectionId, [name: string, date: Date][]>> = {
  today: [
    ['today 1', createDate(0, 0)],
    ['today 2', createDate(0, 4)],
    ['today 3', createDate(0, 8)],
    ['today 4', createDate(0, 23)],
  ],
  yesterday: [
    ['yesterday 1', createDate(1, 0)],
    ['yesterday 2', createDate(1, 3)],
    ['yesterday 3', createDate(1, 12)],
    ['yesterday 4', createDate(1, 23)],
  ],
  previous7Days: [
    ['last 7 days 1', createDate(2, 0)],
    ['last 7 days 2', createDate(3, 5)],
    ['last 7 days 3', createDate(4, 9)],
    ['last 7 days 4', createDate(7, 23)],
  ],
  previous30Days: [
    ['last 30 days 1', createDate(8, 0)],
    ['last 30 days 2', createDate(10, 0)],
    ['last 30 days 3', createDate(15, 0)],
    ['last 30 days 4', createDate(30, 23)],
  ],
  earlier: [
    ['earlier 1', createDate(31, 0)],
    ['earlier 2', createDate(60, 0)],
    ['earlier 3', createDate(90, 0)],
    ['earlier 4', createDate(200, 0)],
    ['earlier 5', createDate(365, 0)],
    ['earlier 6', createDate(1000, 0)],
  ],
}

const MOCK_VIEWED: RecentDocumentsItem[] = []
const MOCK_MODIFIED: RecentDocumentsItem[] = []
for (const [, items] of Object.entries(MOCK_DATES)) {
  const nullDate = new Date()
  for (const [name, date] of items) {
    MOCK_VIEWED.push(createRecentDocumentsItem({ name, lastViewed: date, lastModified: nullDate }))
    MOCK_MODIFIED.push(createRecentDocumentsItem({ name, lastViewed: nullDate, lastModified: date }))
  }
}

describe('RecentDocumentsTable', () => {
  test('Splits items into time-based sections correctly', async () => {
    const sectionsLastViewed = splitIntoSections(MOCK_VIEWED, 'lastViewed')
    expectSections('lastViewed', sectionsLastViewed)
    const sectionsLastModified = splitIntoSections(MOCK_MODIFIED, 'lastModified')
    expectSections('lastModified', sectionsLastModified)
  })

  describe('getOwnerName', () => {
    // TODO: not sure how this test is supposed to work?
    test('Will return the user email if name is not populated and the document is owned by the user', () => {
      const recentDocument = RecentDocumentsItem.create({
        name: 'doc 2',
        linkId: 'link 1',
        parentLinkId: undefined,
        volumeId: 'volume 1',
        lastViewed: new ServerTime(1),
        lastModified: new ServerTime(1),
        createdBy: undefined,
        location: { type: 'root' },
        isSharedWithMe: false,
        shareId: 'share1',
      })
      expect(getOwnerName(recentDocument)).toBe('Me')
    })

    // TODO: not sure how this test is supposed to work?
    test('Will return the user if name is populated and the document is owned by the user', () => {
      const recentDocument = RecentDocumentsItem.create({
        name: 'doc 2',
        linkId: 'link 1',
        parentLinkId: undefined,
        volumeId: 'volume 1',
        lastViewed: new ServerTime(1),
        lastModified: new ServerTime(1),
        createdBy: undefined,
        location: { type: 'root' },
        isSharedWithMe: false,
        shareId: 'share1',
      })
      expect(getOwnerName(recentDocument)).toBe('Me')
    })

    test('Will return the contact display name if it is present and the document is shared with the user', () => {
      const recentDocument = RecentDocumentsItem.create({
        name: 'doc 2',
        linkId: 'link 1',
        parentLinkId: undefined,
        volumeId: 'volume 1',
        lastViewed: new ServerTime(1),
        lastModified: new ServerTime(1),
        createdBy: 'joe@proton.ch',
        location: { type: 'shared-with-me' },
        isSharedWithMe: true,
        shareId: 'share1',
      })
      const contacts = [{ Name: 'Joe Bloggs', Email: 'joe@proton.ch' }] as ContactEmail[]
      expect(getOwnerName(recentDocument, contacts)).toBe('Joe Bloggs')
    })

    test('Will return the contact email if there is no name and the document is shared with the user', () => {
      const recentDocument = RecentDocumentsItem.create({
        name: 'doc 2',
        linkId: 'link 1',
        parentLinkId: undefined,
        volumeId: 'volume 1',
        lastViewed: new ServerTime(1),
        lastModified: new ServerTime(1),
        createdBy: 'joe@proton.ch',
        location: { type: 'shared-with-me' },
        isSharedWithMe: true,
        shareId: 'share1',
      })
      const contacts = [{ Email: 'joe@proton.ch' }] as ContactEmail[]
      expect(getOwnerName(recentDocument, contacts)).toBe('joe@proton.ch')
    })

    test('Will return the createdBy email if no contact matches the createdBy field due to incorrect filtering', () => {
      const recentDocument = RecentDocumentsItem.create({
        name: 'doc 2',
        linkId: 'link 1',
        parentLinkId: undefined,
        volumeId: 'volume 1',
        lastViewed: new ServerTime(1),
        lastModified: new ServerTime(1),
        createdBy: 'unknown@proton.ch',
        location: { type: 'shared-with-me' },
        isSharedWithMe: true,
        shareId: 'share1',
      })
      const contacts = [
        { Name: 'Joe Bloggs', Email: 'joe@proton.ch' },
        { Name: 'Jane Doe', Email: 'jane@proton.ch' },
      ] as ContactEmail[]

      expect(getOwnerName(recentDocument, contacts)).toBe('unknown@proton.ch')
    })

    test('Will return the contact name if the contact matches the createdBy field', () => {
      const recentDocument = RecentDocumentsItem.create({
        name: 'doc 2',
        linkId: 'link 1',
        parentLinkId: undefined,
        volumeId: 'volume 1',
        lastViewed: new ServerTime(1),
        lastModified: new ServerTime(1),
        createdBy: 'jane@proton.ch',
        location: { type: 'shared-with-me' },
        isSharedWithMe: true,
        shareId: 'share1',
      })
      const contacts = [
        { Name: 'Joe Bloggs', Email: 'joe@proton.ch' },
        { Name: 'Jane Doe', Email: 'jane@proton.ch' },
      ] as ContactEmail[]

      expect(getOwnerName(recentDocument, contacts)).toBe('Jane Doe')
    })
  })
})

function expectSections(property: 'lastViewed' | 'lastModified', sections: ReturnType<typeof splitIntoSections>) {
  expect(sections).toHaveLength(Object.keys(MOCK_DATES).length)
  for (const [sectionName, sectionEntries] of Object.entries(MOCK_DATES)) {
    const section = sections.find((section) => section.id === sectionName)!
    expect(section).toBeDefined()
    const mockNames = sectionEntries
      .sort(([, a], [, b]) => b.getTime() - a.getTime())
      .map(([name]) => name)
      .join(',')
    const itemNames = section.items.map((item) => item.name).join(',')
    expect(itemNames).toBe(mockNames)
  }
}
