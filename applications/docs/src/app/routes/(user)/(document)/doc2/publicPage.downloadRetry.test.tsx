import type * as ReactModule from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'

import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import type { PublicDocumentViewerProps } from './__components/PublicDocumentViewer'
import type { PublicLinkHandoff } from './__utils/publicLink'
import PublicDocumentPageV2 from './publicPage'

// A retry remounts the viewer: the page, not the viewer, remembers that the download started
const mockViewerMounts: PublicDocumentViewerProps[] = []
vi.mock('./__components/PublicDocumentViewer', async () => {
  const { useState } = await vi.importActual<typeof ReactModule>('react')
  return {
    PublicDocumentViewer: (props: PublicDocumentViewerProps) => {
      const [mountProps] = useState(() => {
        mockViewerMounts.push(props)
        return props
      })
      return (
        <div>
          <button onClick={() => mountProps.onDownloadOnOpen?.(Promise.resolve(true))}>Download</button>
          <button onClick={props.onRetry}>Retry</button>
        </div>
      )
    },
  }
})
vi.mock('./__utils/flags', () => ({ usePublicEditingEnabled: () => false }))
vi.mock('~/utils/flags', () => ({ useIsSheetsEnabled: () => true }))
vi.mock('@proton-docs/realtime-sdk', async () => ({
  ...(await vi.importActual('@proton-docs/realtime-sdk')),
  version: '0.0.0',
}))

test('a retry after the download started does not download again', async () => {
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  const application = {
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as unknown as ApplicationProviderProps['application']
  render(
    <AuthenticationContext.Provider value={{ getLocalID: () => undefined } as any}>
      <ApplicationProvider application={application}>
        <MemoryRouter initialEntries={['/doc2?mode=open-url-download&token=TOKEN&linkId=LINK']}>
          <CompatRouter>
            <DocsUrlContextProvider>
              <PublicDocumentPageV2 {...({} as PublicLinkHandoff)} />
            </DocsUrlContextProvider>
          </CompatRouter>
        </MemoryRouter>
      </ApplicationProvider>
    </AuthenticationContext.Provider>,
  )
  expect(mockViewerMounts[0].downloadOnOpen).toBe(true)

  await userEvent.click(screen.getByRole('button', { name: 'Download' }))
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

  expect(mockViewerMounts).toHaveLength(2)
  expect(mockViewerMounts[1].downloadOnOpen).toBe(false)
})
