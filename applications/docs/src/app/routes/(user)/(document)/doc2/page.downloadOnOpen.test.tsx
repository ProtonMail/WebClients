import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CompatRouter, Route, Routes } from 'react-router-dom-v5-compat'

import { ConfigContext } from '@proton/app-context/configContext'
import AuthenticationContext from '@proton/components/containers/authentication/authenticationContext'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config'

import { ApplicationProvider, type ApplicationProviderProps } from '~/utils/application-context'
import { DocsUrlContextProvider } from '~/utils/docs-url-bar'
import type { DocumentViewerV2Props } from './__components/DocumentViewerV2'
import DocumentPageV2 from './page'

// The viewer has its own tests for downloading once it shows the document; here, what the page tells it, and across
// a retry, which remounts it
const mockViewerMounts: DocumentViewerV2Props[] = []
jest.mock('./__components/DocumentViewerV2', () => {
  const { useState } = jest.requireActual('react')
  return {
    DocumentViewerV2: (props: DocumentViewerV2Props) => {
      const [mountProps] = useState(() => {
        mockViewerMounts.push(props)
        return props
      })
      return (
        <div>
          <span data-testid="viewer-download">{String(props.downloadOnOpen ?? false)}</span>
          <button onClick={mountProps.onDownloadedOnOpen}>Downloaded</button>
          <button onClick={props.onRetry}>Retry</button>
        </div>
      )
    },
  }
})
jest.mock('@proton-docs/realtime-sdk', () => ({ ...jest.requireActual('@proton-docs/realtime-sdk'), version: '0.0.0' }))

describe('DocumentPageV2 with Drive’s Download', () => {
  let replaceState: jest.SpyInstance

  beforeEach(() => {
    replaceState = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    mockViewerMounts.length = 0
    jest.restoreAllMocks()
  })

  test('mode download has the viewer download, even once the address bar opens the document', () => {
    renderAt('/doc2?mode=download&volumeId=VOLUME&linkId=LINK')

    expect(replaceState).toHaveBeenCalled()
    expect(screen.getByTestId('viewer-download')).toHaveTextContent('true')
    expect(mockViewerMounts[0].nodeMeta).toEqual({ volumeId: 'VOLUME', linkId: 'LINK' })
  })

  test('a retry after the viewer downloaded does not download again', async () => {
    renderAt('/doc2?mode=download&volumeId=VOLUME&linkId=LINK')

    await userEvent.click(screen.getByRole('button', { name: 'Downloaded' }))
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(mockViewerMounts).toHaveLength(2)
    expect(mockViewerMounts[1].downloadOnOpen).toBe(false)
  })

  test('a retry before the viewer downloaded still downloads', async () => {
    renderAt('/doc2?mode=download&volumeId=VOLUME&linkId=LINK')

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(mockViewerMounts).toHaveLength(2)
    expect(mockViewerMounts[1].downloadOnOpen).toBe(true)
  })

  test('mode open does not download', () => {
    renderAt('/doc2?mode=open&volumeId=VOLUME&linkId=LINK')

    expect(screen.getByTestId('viewer-download')).toHaveTextContent('false')
    expect(replaceState).not.toHaveBeenCalled()
  })

  function renderAt(path: string) {
    const application = {
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    } as unknown as ApplicationProviderProps['application']
    render(
      <ConfigContext.Provider value={{ APP_VERSION: '0.0.0' } as ProtonConfig}>
        <AuthenticationContext.Provider value={{ getLocalID: () => 1 } as any}>
          <ApplicationProvider application={application}>
            <MemoryRouter initialEntries={[path]}>
              <CompatRouter>
                <DocsUrlContextProvider>
                  <Routes>
                    <Route path="/doc2" element={<DocumentPageV2 driveCompat={{} as DriveCompat} />} />
                  </Routes>
                </DocsUrlContextProvider>
              </CompatRouter>
            </MemoryRouter>
          </ApplicationProvider>
        </AuthenticationContext.Provider>
      </ConfigContext.Provider>,
    )
  }
})
