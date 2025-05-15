import '@testing-library/jest-dom'
import { ServerTime } from '@proton/docs-shared'
import { RecentDocumentsItem } from '@proton/docs-core'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { getOwnerName } from './get-owner-name'

jest.mock('@proton/shared/lib/i18n', () => ({ dateLocale: { code: 'us' } }))

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
