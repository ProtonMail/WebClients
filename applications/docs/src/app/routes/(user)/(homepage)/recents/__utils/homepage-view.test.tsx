import { RecentDocumentsItem } from '@proton/docs-core'
import { ServerTime } from '@proton/docs-shared'
import type { ItemsSectionId } from './homepage-view'
import { filterDocuments, splitIntoSectionsByTime } from './homepage-view'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

function createMockItems({ firstNameOverride }: { firstNameOverride?: string } = {}) {
  return [
    RecentDocumentsItem.create({
      type: 'document',
      name: firstNameOverride ?? 'name 1',
      linkId: 'link 1',
      parentLinkId: undefined,
      volumeId: 'volume 1',
      lastViewed: new ServerTime(1),
      lastModified: new ServerTime(1),
      createdBy: undefined,
      location: { type: 'root' },
      isSharedWithMe: false,
      shareId: 'share1',
    }),
    RecentDocumentsItem.create({
      type: 'document',
      name: 'name 2',
      linkId: 'link 2',
      parentLinkId: undefined,
      volumeId: 'volume 2',
      lastViewed: new ServerTime(2),
      lastModified: new ServerTime(2),
      createdBy: undefined,
      location: { type: 'root' },
      isSharedWithMe: false,
      shareId: 'share2',
    }),
    RecentDocumentsItem.create({
      type: 'document',
      name: 'name 3',
      linkId: 'link 3',
      parentLinkId: undefined,
      volumeId: 'volume 3',
      lastViewed: new ServerTime(3),
      lastModified: new ServerTime(3),
      createdBy: undefined,
      location: { type: 'shared-with-me' },
      isSharedWithMe: true,
      shareId: 'share3',
    }),
  ]
}

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
    type: 'document',
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

const MOCK_DATES: Partial<Record<ItemsSectionId, [name: string, date: Date][]>> = {
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

describe('useHomepageView', () => {
  describe('filterDocuments', () => {
    test('if no search, return all items', () => {
      const items = createMockItems()
      expect(filterDocuments(items, undefined)).toEqual(items)
    })

    test('filter items starting with search term', () => {
      const items = createMockItems({ firstNameOverride: 'custom' })
      expect(filterDocuments(items, 'name')).toEqual([items[1], items[2]])
    })

    test('filter items ending with search term', () => {
      const items = createMockItems({ firstNameOverride: 'custom 2' })
      expect(filterDocuments(items, '2')).toEqual([items[0], items[1]])
    })

    test('filter items with term in the middle', () => {
      const items = createMockItems({ firstNameOverride: 'custom 2' })
      expect(filterDocuments(items, 'am')).toEqual([items[1], items[2]])
    })

    test('filter items with a term that does not match', () => {
      const items = createMockItems()
      expect(filterDocuments(items, 'nonexistent')).toEqual([])
    })
  })

  describe('splitIntoSectionsByTime', () => {
    test('Splits items into time-based sections correctly', async () => {
      const sectionsLastViewed = splitIntoSectionsByTime(MOCK_VIEWED, 'lastViewed')
      expectSections(sectionsLastViewed)
      const sectionsLastModified = splitIntoSectionsByTime(MOCK_MODIFIED, 'lastModified')
      expectSections(sectionsLastModified)
    })
  })
})

function expectSections(sections: ReturnType<typeof splitIntoSectionsByTime>) {
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
