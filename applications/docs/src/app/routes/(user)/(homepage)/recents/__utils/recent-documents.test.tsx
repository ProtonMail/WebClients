import { RecentDocumentItem } from '@proton/docs-core'
import { ServerTime } from '@proton/docs-shared'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { filterDocuments, getDocumentOwnerDisplayName } from './recent-documents'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

describe('useRecentDocuments', () => {
  describe('filterItems', () => {
    test('if filter is set to "owned-by-me" will return items that are not shared with the user', () => {
      const items: RecentDocumentItem[] = [
        new RecentDocumentItem(
          'name 1',
          'link 1',
          undefined,
          'volume 1',
          new ServerTime(1),
          undefined,
          undefined,
          false,
          'share1',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 2',
          'link 2',
          undefined,
          'volume 2',
          new ServerTime(2),
          undefined,
          undefined,
          undefined,
          'share2',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 3',
          'link 3',
          undefined,
          'volume 3',
          new ServerTime(3),
          undefined,
          undefined,
          true,
          'share3',
          true,
          [],
        ),
      ]
      expect(filterDocuments(items, undefined, 'owned-by-me')).toEqual([items[0], items[1]])
    })

    test('if filter is set to "owned-by-others" will return items that are shared with the user', () => {
      const items: RecentDocumentItem[] = [
        new RecentDocumentItem(
          'name 1',
          'link 1',
          undefined,
          'volume 1',
          new ServerTime(1),
          undefined,
          undefined,
          false,
          'share1',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 2',
          'link 2',
          undefined,
          'volume 2',
          new ServerTime(2),
          undefined,
          undefined,
          undefined,
          'share2',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 3',
          'link 3',
          undefined,
          'volume 3',
          new ServerTime(3),
          undefined,
          undefined,
          true,
          'share3',
          true,
          [],
        ),
      ]
      expect(filterDocuments(items, undefined, 'owned-by-others')).toEqual([items[2]])
    })

    test('if filter is not populated return all items', () => {
      const items: RecentDocumentItem[] = [
        new RecentDocumentItem(
          'name 1',
          'link 1',
          undefined,
          'volume 1',
          new ServerTime(1),
          undefined,
          undefined,
          false,
          'share1',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 2',
          'link 2',
          undefined,
          'volume 2',
          new ServerTime(2),
          undefined,
          undefined,
          undefined,
          'share2',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 3',
          'link 3',
          undefined,
          'volume 3',
          new ServerTime(3),
          undefined,
          undefined,
          true,
          'share3',
          true,
          [],
        ),
      ]
      expect(filterDocuments(items, undefined, undefined)).toEqual(items)
    })

    test('filter items starting with search term', () => {
      const items: RecentDocumentItem[] = [
        new RecentDocumentItem(
          '1',
          'link 1',
          undefined,
          'volume 1',
          new ServerTime(1),
          undefined,
          undefined,
          false,
          'share1',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 2',
          'link 2',
          undefined,
          'volume 2',
          new ServerTime(2),
          undefined,
          undefined,
          undefined,
          'share2',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 3',
          'link 3',
          undefined,
          'volume 3',
          new ServerTime(3),
          undefined,
          undefined,
          true,
          'share3',
          true,
          [],
        ),
      ]
      expect(filterDocuments(items, 'name', undefined)).toEqual([items[1], items[2]])
    })

    test('filter items ending with search term', () => {
      const items: RecentDocumentItem[] = [
        new RecentDocumentItem(
          'doc 2',
          'link 1',
          undefined,
          'volume 1',
          new ServerTime(1),
          undefined,
          undefined,
          false,
          'share1',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 2',
          'link 2',
          undefined,
          'volume 2',
          new ServerTime(2),
          undefined,
          undefined,
          undefined,
          'share2',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 3',
          'link 3',
          undefined,
          'volume 3',
          new ServerTime(3),
          undefined,
          undefined,
          true,
          'share3',
          true,
          [],
        ),
      ]
      expect(filterDocuments(items, '2', undefined)).toEqual([items[0], items[1]])
    })

    test('filter items with term in the middle', () => {
      const items: RecentDocumentItem[] = [
        new RecentDocumentItem(
          'doc 2',
          'link 1',
          undefined,
          'volume 1',
          new ServerTime(1),
          undefined,
          undefined,
          false,
          'share1',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 2',
          'link 2',
          undefined,
          'volume 2',
          new ServerTime(2),
          undefined,
          undefined,
          undefined,
          'share2',
          false,
          [],
        ),
        new RecentDocumentItem(
          'name 3',
          'link 3',
          undefined,
          'volume 3',
          new ServerTime(3),
          undefined,
          undefined,
          true,
          'share3',
          true,
          [],
        ),
      ]
      expect(filterDocuments(items, 'am', undefined)).toEqual([items[1], items[2]])
    })
  })

  describe('getDisplayName', () => {
    test('Will return the user email if name is not populated and the document is owned by the user', () => {
      const recentDocument = new RecentDocumentItem(
        'doc 2',
        'link 1',
        undefined,
        'volume 1',
        new ServerTime(1),
        undefined,
        undefined,
        false,
        'share1',
        true,
        ['folder1', 'subfolder', 'doc2'],
      )
      expect(getDocumentOwnerDisplayName(recentDocument)).toBe('Me')
    })

    test('Will return the user if name is populated and the document is owned by the user', () => {
      const recentDocument = new RecentDocumentItem(
        'doc 2',
        'link 1',
        undefined,
        'volume 1',
        new ServerTime(1),
        undefined,
        undefined,
        false,
        'share1',
        true,
        ['folder1', 'subfolder', 'doc2'],
      )
      expect(getDocumentOwnerDisplayName(recentDocument)).toBe('Me')
    })

    test('Will return the contact display name if it is present and the document is shared with the user', () => {
      const recentDocument = new RecentDocumentItem(
        'doc 2',
        'link 1',
        undefined,
        'volume 1',
        new ServerTime(1),
        'joe@proton.ch',
        undefined,
        true,
        'share1',
        true,
        ['shared', 'doc2'],
      )
      const contacts = [{ Name: 'Joe Bloggs', Email: 'joe@proton.ch' }] as unknown as ContactEmail[]
      expect(getDocumentOwnerDisplayName(recentDocument, contacts)).toBe('Joe Bloggs')
    })

    test('Will return the contact email if there is no name and the document is shared with the user', () => {
      const recentDocument = new RecentDocumentItem(
        'doc 2',
        'link 1',
        undefined,
        'volume 1',
        new ServerTime(1),
        'joe@proton.ch',
        undefined,
        true,
        'share1',
        true,
        ['shared', 'doc2'],
      )
      const contacts = [{ Email: 'joe@proton.ch' }] as unknown as ContactEmail[]
      expect(getDocumentOwnerDisplayName(recentDocument, contacts)).toBe('joe@proton.ch')
    })

    test('Will return the createdBy email if no contact matches the createdBy field due to incorrect filtering', () => {
      const recentDocument = new RecentDocumentItem(
        'doc 2',
        'link 1',
        undefined,
        'volume 1',
        new ServerTime(1),
        'unknown@proton.ch',
        undefined,
        true,
        'share1',
        true,
        [],
      )
      const contacts = [
        { Name: 'Joe Bloggs', Email: 'joe@proton.ch' },
        { Name: 'Jane Doe', Email: 'jane@proton.ch' },
      ] as unknown as ContactEmail[]

      expect(getDocumentOwnerDisplayName(recentDocument, contacts)).toBe('unknown@proton.ch')
    })

    test('Will return the contact name if the contact matches the createdBy field', () => {
      const recentDocument = new RecentDocumentItem(
        'doc 2',
        'link 1',
        undefined,
        'volume 1',
        new ServerTime(1),
        'jane@proton.ch',
        undefined,
        true,
        'share1',
        true,
        ['shared', 'doc2'],
      )
      const contacts = [
        { Name: 'Joe Bloggs', Email: 'joe@proton.ch' },
        { Name: 'Jane Doe', Email: 'jane@proton.ch' },
      ] as unknown as ContactEmail[]

      expect(getDocumentOwnerDisplayName(recentDocument, contacts)).toBe('Jane Doe')
    })
  })
})
