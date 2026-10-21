import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SheetsDependenciesProvider, type SheetsDependencies } from '../../SheetsDependenciesProvider'
import { Grid } from './Grid'

type CanvasGridLicenseProps = { licenseKey?: string }

const mockCanvasGrid = jest.fn((_props: CanvasGridLicenseProps) => null)
// The vendored rowsncolumns packages, which constants.ts also imports, load ESM-only konva and xlsx that jest cannot require.
jest.mock('@rowsncolumns/spreadsheet', () => ({
  CanvasGrid: jest.requireActual('react').forwardRef(function CanvasGrid(props: CanvasGridLicenseProps, _ref: unknown) {
    return mockCanvasGrid(props)
  }),
}))
jest.mock('@rowsncolumns/grid', () => ({}))
jest.mock('@rowsncolumns/charts', () => ({}))
jest.mock('../../constants', () => ({}))
// The UI store needs a full spreadsheet state; the license does not depend on it.
jest.mock('../../ui-store', () => ({
  useUI: Object.assign(() => undefined, { $: { legacy: {} } }),
}))

function renderGrid(licenseKey: string | undefined) {
  const dependencies = { isDevOrBlack: () => false, licenseKey } as SheetsDependencies
  function wrapper({ children }: { children: ReactNode }) {
    return <SheetsDependenciesProvider dependencies={dependencies}>{children}</SheetsDependenciesProvider>
  }
  render(<Grid />, { wrapper })
  return mockCanvasGrid.mock.lastCall?.[0]
}

const environmentLicenseKey = process.env.DOCS_SHEETS_KEY

afterEach(() => {
  mockCanvasGrid.mockClear()
  if (environmentLicenseKey === undefined) {
    delete process.env.DOCS_SHEETS_KEY
  } else {
    process.env.DOCS_SHEETS_KEY = environmentLicenseKey
  }
})

it('passes the host-supplied license key to the grid unchanged', () => {
  expect(renderGrid('synthetic-license-key')?.licenseKey).toBe('synthetic-license-key')
})

it('passes no license key when the host supplies none, even if the environment has one', () => {
  process.env.DOCS_SHEETS_KEY = 'synthetic-environment-key'
  const props = renderGrid(undefined)
  expect(props).toBeDefined()
  expect(props?.licenseKey).toBeUndefined()
})
