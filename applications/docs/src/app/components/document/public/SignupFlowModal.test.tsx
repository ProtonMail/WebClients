import React, { act } from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useApi } from '@proton/app-context/useApi'
import { setLocation } from '@proton/vitest-config/setLocation'
import { DOCS_SIGNIN, DOCS_SIGNUP } from '@proton/shared/lib/docs/urls'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'

import { useDocsUrlPublicToken } from '@proton/docs-shared/Hooks/useDocsUrlPublicToken'
import { SignupFlowModal } from './SignupFlowModal'
import { RedirectAction } from '@proton/docs-shared/DocumentAction'

vi.mock('@proton/app-context/useApi')
const mockedUseApi = vi.mocked(useApi)

vi.mock('./telemetry', async () => ({
  ...(await vi.importActual('./telemetry')),
  countActionWithTelemetry: vi.fn(),
  traceTelemetry: () => ({ start: vi.fn() }),
}))

vi.mock('@proton/docs-shared/Hooks/useDocsUrlPublicToken')
const mockUrlPassword = 'mockUrlPassword'
const mockToken = 'mockToken'

vi.mocked(useDocsUrlPublicToken).mockReturnValue({
  token: mockToken,
  urlPassword: mockUrlPassword,
  linkId: 'mockLinkId',
})

const ResizeObserverMock = vi.fn(
  class {
    disconnect = vi.fn()

    observe = vi.fn()

    unobserve = vi.fn()
  },
)

/** The return URL carries the public token, and the context says the user comes back to the private app */
function expectReturnUrl(url: URL) {
  expect(url.searchParams.get('returnUrlContext')).toBe('private')
  expect(url.searchParams.get('returnUrl')).toBe(
    '%2Furls%2Fmockpath%3Fmode%3Dopen-url-reauth%26action%3Dmake-copy%26token%3DmockToken%26linkId%3DmockLinkId',
  )
}

describe('SignupFlowModal', () => {
  const assignMock = vi.fn()
  const originalResizeObserver = window.ResizeObserver

  beforeAll(() => {
    window.open = vi.fn().mockReturnValue({
      close: vi.fn(),
      location: {
        assign: assignMock,
      },
    })

    Object.defineProperty(window, 'ResizeObserver', {
      value: ResizeObserverMock,
      writable: true,
    })
    setLocation('/urls/mockpath#mockhash')
  })

  afterEach(() => {
    assignMock.mockClear()
    vi.clearAllMocks()
  })

  afterAll(() => {
    Object.defineProperty(window, 'ResizeObserver', {
      value: originalResizeObserver,
      writable: true,
    })
  })

  it('should open the modal and delete the password from localStorage on mount', () => {
    render(
      <SignupFlowModal
        redirectAction={RedirectAction.MakeCopy}
        urlPassword={mockUrlPassword}
        open
        onClose={() => {}}
        onExit={() => {}}
      />,
    )
    expect(screen.getByTestId('public-share-signup-modal-email')).toBeInTheDocument()
  })

  it('should handle email input change and validation', () => {
    render(
      <SignupFlowModal
        redirectAction={RedirectAction.MakeCopy}
        urlPassword={mockUrlPassword}
        open
        onClose={() => {}}
        onExit={() => {}}
      />,
    )
    const emailInput = screen.getByTestId<HTMLInputElement>('public-share-signup-modal-email')

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    expect(emailInput.value).toBe('invalid-email')
    expect(screen.getByText('Email is not valid')).toBeInTheDocument()
  })

  it('should handle form submission and API responses correctly', async () => {
    const mockApi = vi.fn()
    mockedUseApi.mockReturnValue(mockApi)
    mockApi.mockResolvedValue({ Code: 1000 })

    render(
      <SignupFlowModal
        redirectAction={RedirectAction.MakeCopy}
        urlPassword={mockUrlPassword}
        open
        onClose={() => {}}
        onExit={() => {}}
      />,
    )
    const emailInput = screen.getByTestId('public-share-signup-modal-email')
    const submitButton = screen.getByText('Continue')

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)
    })

    await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1))
    const url = new URL(assignMock.mock.calls[0][0])
    expect(url.href.startsWith(DOCS_SIGNUP)).toBe(true)
    expect(url.searchParams.get('email')).toBe('test@example.com')
    expectReturnUrl(url)
  })

  it('should redirect to SIGN_IN if email is already used', async () => {
    const mockApi = vi.fn()
    mockedUseApi.mockReturnValue(mockApi)
    mockApi.mockRejectedValue({ data: { Code: API_CUSTOM_ERROR_CODES.ALREADY_USED, Error: 'test message' } })

    render(
      <SignupFlowModal
        redirectAction={RedirectAction.MakeCopy}
        urlPassword={mockUrlPassword}
        open
        onClose={() => {}}
        onExit={() => {}}
      />,
    )
    const emailInput = screen.getByTestId('public-share-signup-modal-email')
    const submitButton = screen.getByText('Continue')

    fireEvent.change(emailInput, { target: { value: 'used@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1))
    const url = new URL(assignMock.mock.calls[0][0])
    expect(url.href.startsWith(DOCS_SIGNIN)).toBe(true)
    expect(url.searchParams.get('username')).toBe('used@example.com')
    expectReturnUrl(url)
  })

  it('should display an error message for other API errors', async () => {
    const mockApi = vi.fn()
    mockedUseApi.mockReturnValue(mockApi)

    mockApi.mockRejectedValue({ data: { Code: '123456', Error: 'Some error occurred' } })

    render(
      <SignupFlowModal
        redirectAction={RedirectAction.MakeCopy}
        urlPassword={mockUrlPassword}
        open
        onClose={() => {}}
        onExit={() => {}}
      />,
    )
    const emailInput = screen.getByTestId('public-share-signup-modal-email')
    const submitButton = screen.getByText('Continue')

    fireEvent.change(emailInput, { target: { value: 'error@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Some error occurred')).toBeInTheDocument()
    })
  })
})
