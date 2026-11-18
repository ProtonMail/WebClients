import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { HomepageViewContext, type HomepageViewValue } from '../homepageViewContext'
import type { ExtendedInvitationDetails } from '../invitationTypes'
import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '../utils/mimetype'
import { useOpenInvitedDocument } from './useOpenInvitedDocument'

function createInvitation(mimeType: string) {
  return {
    share: { volumeId: 'shareVolume' },
    link: { linkId: 'invitedLink', mimeType },
  } as unknown as ExtendedInvitationDetails
}

function renderOpenInvitedDocument() {
  // As the host's getAppHref: the app's origin, and the signed-in user's local ID.
  const getAppHref = jest.fn((path: string) => `https://docs.proton.me/u/3${path}`)
  const { result } = renderHook(() => useOpenInvitedDocument(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <HomepageViewContext.Provider value={{ getAppHref } as unknown as HomepageViewValue}>
        {children}
      </HomepageViewContext.Provider>
    ),
  })
  return { openInvitedDocument: result.current, getAppHref }
}

function mockNewTab() {
  const newTab = { location: { assign: jest.fn() } }
  jest.spyOn(window, 'open').mockReturnValue(newTab as unknown as Window)
  return newTab
}

afterEach(() => jest.restoreAllMocks())

describe('useOpenInvitedDocument', () => {
  test('opens an invited document in a new tab, for the signed-in user', () => {
    const newTab = mockNewTab()
    const { openInvitedDocument } = renderOpenInvitedDocument()

    openInvitedDocument(createInvitation(PROTON_DOCS_DOCUMENT_MIMETYPE))

    expect(newTab.location.assign).toHaveBeenCalledWith(
      new URL('https://docs.proton.me/u/3/doc?mode=open&volumeId=shareVolume&linkId=invitedLink'),
    )
  })

  test('opens an invited spreadsheet in the spreadsheet editor', () => {
    const newTab = mockNewTab()
    const { openInvitedDocument, getAppHref } = renderOpenInvitedDocument()

    openInvitedDocument(createInvitation(PROTON_DOCS_SPREADSHEET_MIMETYPE))

    expect(getAppHref).toHaveBeenCalledWith('/sheet', 'proton-docs')
    expect(String(newTab.location.assign.mock.calls[0][0])).toMatch(/^https:\/\/docs\.proton\.me\/u\/3\/sheet\?/)
  })

  test('opens the document in the current tab when the browser blocks new tabs', () => {
    jest.spyOn(window, 'open').mockReturnValue(null)
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    // jsdom can't navigate, nor can tests replace `location.assign`: it reports the navigation as not implemented.
    const reportError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { openInvitedDocument } = renderOpenInvitedDocument()

    openInvitedDocument(createInvitation(PROTON_DOCS_DOCUMENT_MIMETYPE))

    expect(reportError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/navigation/) }))
  })
})
