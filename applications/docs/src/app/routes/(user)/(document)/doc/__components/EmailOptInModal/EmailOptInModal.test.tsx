import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useDocsNotifications } from '../../../../../../Containers/DocsNotificationsProvider'
import { EmailOptInModal } from './EmailOptInModal'

jest.mock('../../../../../../Containers/DocsNotificationsProvider')
const mockUpdateNotificationSettings = jest.fn()

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver

describe('EmailOptInModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onExit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useDocsNotifications).mockReturnValue({
      updateNotificationSettings: mockUpdateNotificationSettings,
      emailTitleEnabled: false,
      emailNotificationsEnabled: false,
      isLoading: false,
      isSubmitting: false,
      isReady: true,
      changeEmailNotificationsEnabledValue: jest.fn(),
      changeDocumentTitleEnabledValue: jest.fn(),
    })
  })

  it('renders with default values', () => {
    render(<EmailOptInModal {...defaultProps} />)

    expect(screen.getByText('Get Notified About Comments')).toBeInTheDocument()
    expect(screen.getByTestId('enable-notifications')).not.toBeChecked()
    expect(screen.getByTestId('include-doc-name')).not.toBeChecked()
  })

  it('initializes with provider values', () => {
    jest.mocked(useDocsNotifications).mockReturnValue({
      updateNotificationSettings: mockUpdateNotificationSettings,
      emailTitleEnabled: true,
      emailNotificationsEnabled: true,
      isLoading: false,
      isSubmitting: false,
      isReady: true,
      changeEmailNotificationsEnabledValue: jest.fn(),
      changeDocumentTitleEnabledValue: jest.fn(),
    })

    render(<EmailOptInModal {...defaultProps} />)

    expect(screen.getByTestId('enable-notifications')).toBeChecked()
    expect(screen.getByTestId('include-doc-name')).toBeChecked()
  })

  it('saves preferences with both toggles enabled', async () => {
    render(<EmailOptInModal {...defaultProps} />)

    // Enable both toggles
    fireEvent.click(screen.getByTestId('enable-notifications'))
    fireEvent.click(screen.getByTestId('include-doc-name'))

    // Click save
    fireEvent.click(screen.getByText('Save preferences'))

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalledWith({
        notificationsEnabled: true,
        includeTitleEnabled: true,
      })
    })
  })

  it('saves preferences with only notifications enabled', async () => {
    render(<EmailOptInModal {...defaultProps} />)

    // Enable only notifications
    fireEvent.click(screen.getByTestId('enable-notifications'))

    // Click save
    fireEvent.click(screen.getByText('Save preferences'))

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalledWith({
        notificationsEnabled: true,
        includeTitleEnabled: false,
      })
    })
  })

  it('saves preferences with only document name enabled', async () => {
    render(<EmailOptInModal {...defaultProps} />)

    // Enable only document name
    fireEvent.click(screen.getByTestId('include-doc-name'))

    // Click save
    fireEvent.click(screen.getByText('Save preferences'))

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalledWith({
        notificationsEnabled: false,
        includeTitleEnabled: true,
      })
    })
  })

  it('handles save failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockUpdateNotificationSettings.mockRejectedValueOnce(new Error('Save failed'))

    render(<EmailOptInModal {...defaultProps} />)

    fireEvent.click(screen.getByTestId('enable-notifications'))
    fireEvent.click(screen.getByText('Save preferences'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save preferences:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('closes modal when clicking "Ask me next time"', () => {
    render(<EmailOptInModal {...defaultProps} />)

    fireEvent.click(screen.getByText('Ask me next time'))

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('closes modal after successful save', async () => {
    render(<EmailOptInModal {...defaultProps} />)

    fireEvent.click(screen.getByText('Save preferences'))

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
