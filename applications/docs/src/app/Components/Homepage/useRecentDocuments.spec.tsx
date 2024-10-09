import type { RecentDocumentsSnapshotData } from '@proton/docs-core'
import { filterItems, getDisplayName } from './useRecentDocuments'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

describe('filterItems', () => {
  test('if filter is set to "owned-by-me" will return items that are not shared with the user', () => {
    const items: RecentDocumentsSnapshotData[] = [
      {
        name: 'name 1',
        linkId: 'link 1',
        volumeId: 'volume 1',
        lastViewed: 1,
        isSharedWithMe: false,
      },
      {
        name: 'name 2',
        linkId: 'link 2',
        volumeId: 'volume 2',
        lastViewed: 2,
      },
      {
        name: 'name 3',
        linkId: 'link 3',
        volumeId: 'volume 3',
        lastViewed: 3,
        isSharedWithMe: true,
      },
    ]
    expect(filterItems(items, undefined, 'owned-by-me')).toEqual([items[0], items[1]])
  })
  test('if filter is set to "owned-by-others" will return items that are shared with the user', () => {
    const items: RecentDocumentsSnapshotData[] = [
      {
        name: 'name 1',
        linkId: 'link 1',
        volumeId: 'volume 1',
        lastViewed: 1,
        isSharedWithMe: false,
      },
      {
        name: 'name 2',
        linkId: 'link 2',
        volumeId: 'volume 2',
        lastViewed: 2,
      },
      {
        name: 'name 3',
        linkId: 'link 3',
        volumeId: 'volume 3',
        lastViewed: 3,
        isSharedWithMe: true,
      },
    ]
    expect(filterItems(items, undefined, 'owned-by-others')).toEqual([items[2]])
  })
  test('if filter is not populated return all items', () => {
    const items: RecentDocumentsSnapshotData[] = [
      {
        name: 'name 1',
        linkId: 'link 1',
        volumeId: 'volume 1',
        lastViewed: 1,
        isSharedWithMe: false,
      },
      {
        name: 'name 2',
        linkId: 'link 2',
        volumeId: 'volume 2',
        lastViewed: 2,
      },
      {
        name: 'name 3',
        linkId: 'link 3',
        volumeId: 'volume 3',
        lastViewed: 3,
        isSharedWithMe: true,
      },
    ]
    expect(filterItems(items, undefined, undefined)).toEqual(items)
  })
  test('filter items starting with search term', () => {
    const items: RecentDocumentsSnapshotData[] = [
      {
        name: '1',
        linkId: 'link 1',
        volumeId: 'volume 1',
        lastViewed: 1,
        isSharedWithMe: false,
      },
      {
        name: 'name 2',
        linkId: 'link 2',
        volumeId: 'volume 2',
        lastViewed: 2,
      },
      {
        name: 'name 3',
        linkId: 'link 3',
        volumeId: 'volume 3',
        lastViewed: 3,
        isSharedWithMe: true,
      },
    ]
    expect(filterItems(items, 'name', undefined)).toEqual([items[1], items[2]])
  })
  test('filter items ending with search term', () => {
    const items: RecentDocumentsSnapshotData[] = [
      {
        name: 'doc 2',
        linkId: 'link 1',
        volumeId: 'volume 1',
        lastViewed: 1,
        isSharedWithMe: false,
      },
      {
        name: 'name 2',
        linkId: 'link 2',
        volumeId: 'volume 2',
        lastViewed: 2,
      },
      {
        name: 'name 3',
        linkId: 'link 3',
        volumeId: 'volume 3',
        lastViewed: 3,
        isSharedWithMe: true,
      },
    ]
    expect(filterItems(items, '2', undefined)).toEqual([items[0], items[1]])
  })

  test('filter items with term in the middle', () => {
    const items: RecentDocumentsSnapshotData[] = [
      {
        name: 'doc 2',
        linkId: 'link 1',
        volumeId: 'volume 1',
        lastViewed: 1,
        isSharedWithMe: false,
      },
      {
        name: 'name 2',
        linkId: 'link 2',
        volumeId: 'volume 2',
        lastViewed: 2,
      },
      {
        name: 'name 3',
        linkId: 'link 3',
        volumeId: 'volume 3',
        lastViewed: 3,
        isSharedWithMe: true,
      },
    ]
    expect(filterItems(items, 'am', undefined)).toEqual([items[1], items[2]])
  })
})

describe('getDisplayName', () => {
  test('Will return the user email if name is not populated and the document is owned by the user', () => {
    const recentDocument = {
      name: 'doc 2',
      linkId: 'link 1',
      volumeId: 'volume 1',
      lastViewed: 1,
      isSharedWithMe: false,
    }
    expect(getDisplayName(recentDocument)).toBe('Me')
  })
  test('Will return the user if name is populated and the document is owned by the user', () => {
    const recentDocument = {
      name: 'doc 2',
      linkId: 'link 1',
      volumeId: 'volume 1',
      lastViewed: 1,
      isSharedWithMe: false,
    }
    expect(getDisplayName(recentDocument)).toBe('Me')
  })

  test('Will return the contact display name if it is present and the document is shared with the user', () => {
    const recentDocument = {
      name: 'doc 2',
      linkId: 'link 1',
      volumeId: 'volume 1',
      lastViewed: 1,
      isSharedWithMe: true,
      createdBy: 'joe@proton.ch',
    }
    const contacts = [{ Name: 'Joe Bloggs', Email: 'joe@proton.ch' }] as unknown as ContactEmail[]
    expect(getDisplayName(recentDocument, contacts)).toBe('Joe Bloggs')
  })
  test('Will return the contact email if there is no name and the document is shared with the user', () => {
    const recentDocument = {
      name: 'doc 2',
      linkId: 'link 1',
      volumeId: 'volume 1',
      lastViewed: 1,
      isSharedWithMe: true,
      createdBy: 'joe@proton.ch',
    }
    const contacts = [{ Email: 'joe@proton.ch' }] as unknown as ContactEmail[]
    expect(getDisplayName(recentDocument, contacts)).toBe('joe@proton.ch')
  })
})
