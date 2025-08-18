import React, { act } from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { verifyAllWhenMocksCalled, when } from 'jest-when'

import useApi from '@proton/components/hooks/useApi'
import { DRIVE_SIGNIN, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { replaceUrl } from '@proton/shared/lib/helpers/browser'

import { useDocsUrlPublicToken } from '@proton/drive-store'
import { SignupFlowModal } from './SignupFlowModal'
import { RedirectAction } from '@proton/drive-store/store/_documents'

jest.mock('@proton/components/hooks/useApi')
const mockedUseApi = jest.mocked(useApi)

jest.mock('@proton/shared/lib/helpers/browser')
const mockedReplaceUrl = jest.mocked(replaceUrl)

jest.mock('@proton/drive-store')
const mockUrlPassword = 'mockUrlPassword'
const mockToken = 'mockToken'

jest.mocked(useDocsUrlPublicToken).mockReturnValue({
  token: mockToken,
  urlPassword: mockUrlPassword,
  linkId: 'mockLinkId',
})

const ResizeObserverMock = jest.fn(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}))

const locationMock = {
  pathname: '/urls/mockpath',
  hash: '#mockhash',
  search: '',
}

describe('SignupFlowModal', () => {
  const assignMock = jest.fn()
  const originalWindowLocation = window.location
  const originalResizeObserver = window.ResizeObserver

  beforeAll(() => {
    window.open = jest.fn().mockReturnValue({
      close: jest.fn(),
      location: {
        assign: assignMock,
      },
    })

    Object.defineProperty(window, 'ResizeObserver', {
      value: ResizeObserverMock,
      writable: true,
    })
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
    })
  })

  afterEach(() => {
    assignMock.mockClear()
    jest.clearAllMocks()
  })

  afterAll(() => {
    verifyAllWhenMocksCalled()
    Object.defineProperty(window, 'ResizeObserver', {
      value: originalResizeObserver,
      writable: true,
    })
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalWindowLocation,
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
    const mockApi = jest.fn()
    mockedUseApi.mockReturnValue(mockApi)
    mockApi.mockResolvedValue({ Code: 1000 })
    const expectedReplaceUrl = DRIVE_SIGNUP.concat(
      '?username=test@example.com%40returnUrl=%2Furls%2Fmockpath%23mockhash&returnUrlContext=public',
    )
    when(mockedReplaceUrl).expectCalledWith(expectedReplaceUrl)

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
  })

  it('should redirect to SIGN_IN if email is already used', async () => {
    const mockApi = jest.fn()
    mockedUseApi.mockReturnValue(mockApi)
    mockApi.mockRejectedValue({ data: { Code: API_CUSTOM_ERROR_CODES.ALREADY_USED, Error: 'test message' } })
    const expectedReplaceUrl = DRIVE_SIGNIN.concat(
      '?email=used@example.com%40returnUrl=%2Furls%2Fmockpath%23mockhash&returnUrlContext=public',
    )
    when(mockedReplaceUrl).expectCalledWith(expectedReplaceUrl)

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
  })

  it('should display an error message for other API errors', async () => {
    const mockApi = jest.fn()
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
