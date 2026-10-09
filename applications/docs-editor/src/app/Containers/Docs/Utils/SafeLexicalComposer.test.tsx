import { render, screen } from '@testing-library/react'
import { SafeLexicalComposer } from './SafeLexicalComposer'

const mockReportError = jest.fn()
let mockShouldThrow = false

jest.mock('../DocsDependenciesProvider', () => ({
  useDocsDependencies: () => ({ reportError: mockReportError }),
}))
jest.mock('@lexical/react/LexicalComposer', () => ({
  LexicalComposer: ({ children }: { children: React.ReactNode }) => {
    if (mockShouldThrow) {
      throw new Error('Composer failed')
    }
    return children
  },
}))

const initialConfig = { namespace: 'test', nodes: [], onError: jest.fn() }

beforeEach(() => {
  mockReportError.mockClear()
  mockShouldThrow = false
})

it('renders the editor while composition succeeds', () => {
  render(
    <SafeLexicalComposer initialConfig={initialConfig}>
      <span>Editor content</span>
    </SafeLexicalComposer>,
  )
  expect(screen.getByText('Editor content')).toBeInTheDocument()
})

it('reports a render failure once and shows the Docs fallback', () => {
  mockShouldThrow = true
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    render(
      <SafeLexicalComposer initialConfig={initialConfig}>
        <span>Editor content</span>
      </SafeLexicalComposer>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong:')
    expect(screen.getByRole('alert')).toHaveTextContent('Composer failed')
    expect(mockReportError).toHaveBeenCalledTimes(1)
    expect(mockReportError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Composer failed' }))
  } finally {
    consoleError.mockRestore()
  }
})
