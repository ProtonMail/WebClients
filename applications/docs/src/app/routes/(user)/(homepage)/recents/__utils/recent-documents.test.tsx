import { RecentDocumentsItem } from '@proton/docs-core'
import { ServerTime } from '@proton/docs-shared'
import { filterDocuments } from './recent-documents'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

function createMockItems({ firstNameOverride }: { firstNameOverride?: string } = {}) {
  return [
    RecentDocumentsItem.create({
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

describe('useRecentDocuments', () => {
  describe('filterItems', () => {
    test('if filter is set to "owned-by-me" will return items that are not shared with the user', () => {
      const items = createMockItems()
      expect(filterDocuments(items, undefined, 'owned-by-me')).toEqual([items[0], items[1]])
    })

    test('if filter is set to "owned-by-others" will return items that are shared with the user', () => {
      const items = createMockItems()
      expect(filterDocuments(items, undefined, 'owned-by-others')).toEqual([items[2]])
    })

    test('if filter is not populated return all items', () => {
      const items = createMockItems()
      expect(filterDocuments(items, undefined, undefined)).toEqual(items)
    })

    test('filter items starting with search term', () => {
      const items = createMockItems({ firstNameOverride: 'custom' })
      expect(filterDocuments(items, 'name', undefined)).toEqual([items[1], items[2]])
    })

    test('filter items ending with search term', () => {
      const items = createMockItems({ firstNameOverride: 'custom 2' })
      expect(filterDocuments(items, '2', undefined)).toEqual([items[0], items[1]])
    })

    test('filter items with term in the middle', () => {
      const items = createMockItems({ firstNameOverride: 'custom 2' })
      expect(filterDocuments(items, 'am', undefined)).toEqual([items[1], items[2]])
    })
  })
})
