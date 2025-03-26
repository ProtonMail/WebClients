import { render, waitFor } from '@testing-library/react';

import { useUserSettings } from '@proton/account';
import useLoading from '@proton/hooks/useLoading';
import { getConnectionInformation } from '@proton/shared/lib/api/core/connection-information';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import VPNDrawerContainer from './VPNDrawerContainer';
import useVPNDrawerTelemetry from './useVPNDrawerTelemetry';

// Mock dependencies
jest.mock('@proton/shared/lib/api/core/connection-information');
jest.mock('@proton/shared/lib/api/helpers/customConfig');
jest.mock('@proton/account/index');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/hooks/useLoading');
jest.mock('./useVPNDrawerTelemetry');

describe('VPNDrawerContainer', () => {
    // Mock response data
    const mockConnectionInfo = {
        IsVpnConnection: false,
        IspProvider: 'Orange',
        Ip: '123.456.789.0',
        CountryCode: 'FR',
    };

    // Mock implementations
    const mockGetConnectionInformation = jest.fn(() => ({ url: 'connection-info' }));
    const mockSilentApi = jest.fn().mockResolvedValue(mockConnectionInfo);
    const mockStatusChanged = jest.fn();
    const mockUserSettings = jest.fn();
    const mockUseLoading = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Setup mocks
        (getConnectionInformation as jest.Mock).mockImplementation(mockGetConnectionInformation);
        (getSilentApi as jest.Mock).mockReturnValue(mockSilentApi);
        (useVPNDrawerTelemetry as jest.Mock).mockReturnValue({
            downloadIsClicked: jest.fn(),
            statusChanged: mockStatusChanged,
        });
        (useUserSettings as jest.Mock).mockReturnValue([mockUserSettings, false]);
        (useLoading as jest.Mock).mockReturnValue([false, mockUseLoading]);
        // Mock window events
        window.addEventListener = jest.fn();
        window.removeEventListener = jest.fn();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('should fetch connection information when component mounts', async () => {
        render(<VPNDrawerContainer />);

        await waitFor(() => {
            expect(mockGetConnectionInformation).toHaveBeenCalledTimes(1);
        });
        expect(mockSilentApi).toHaveBeenCalledTimes(1);
    });

    it('should fetch connection information every minute', async () => {
        render(<VPNDrawerContainer />);

        // Initial call
        await waitFor(() => {
            expect(mockGetConnectionInformation).toHaveBeenCalledTimes(1);
        });
        expect(mockSilentApi).toHaveBeenCalledTimes(1);

        // Advance timer by one minute
        jest.advanceTimersByTime(60 * 1000);

        await waitFor(() => {
            expect(mockGetConnectionInformation).toHaveBeenCalledTimes(2);
        });
        expect(mockSilentApi).toHaveBeenCalledTimes(2);

        // Advance timer by another minute
        jest.advanceTimersByTime(60 * 1000);

        await waitFor(() => {
            expect(mockGetConnectionInformation).toHaveBeenCalledTimes(3);
        });
        expect(mockSilentApi).toHaveBeenCalledTimes(3);
    });

    it('should add event listeners for "focus" and "online" events', () => {
        render(<VPNDrawerContainer />);

        expect(window.addEventListener).toHaveBeenCalledTimes(2);
        expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
        expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });

    it('should fetch connection information when window comes online', async () => {
        render(<VPNDrawerContainer />);

        await waitFor(() => {
            expect(mockSilentApi).toHaveBeenCalledTimes(1);
        });

        // Extract the event handler function that was registered
        const onlineHandler = (window.addEventListener as jest.Mock).mock.calls.find((call) => call[0] === 'online')[1];

        // Manually trigger the online event
        onlineHandler();

        await waitFor(() => {
            expect(mockGetConnectionInformation).toHaveBeenCalledTimes(2);
        });
        expect(mockSilentApi).toHaveBeenCalledTimes(2);
    });

    it('should fetch connection information when window gets focus', async () => {
        render(<VPNDrawerContainer />);

        await waitFor(() => {
            expect(mockSilentApi).toHaveBeenCalledTimes(1);
        });

        // Extract the focus handler function
        const focusHandler = (window.addEventListener as jest.Mock).mock.calls.find((call) => call[0] === 'focus')[1];

        // Manually trigger the focus event
        focusHandler();

        await waitFor(() => {
            expect(mockGetConnectionInformation).toHaveBeenCalledTimes(2);
        });
        expect(mockSilentApi).toHaveBeenCalledTimes(2);
    });

    it('should cleanup event listeners and intervals on unmount', () => {
        const { unmount } = render(<VPNDrawerContainer />);

        unmount();

        expect(window.removeEventListener).toHaveBeenCalledTimes(2);
        expect(window.removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
        expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });

    it('should call statusChanged when connection information changes', async () => {
        // First render to set initial state
        render(<VPNDrawerContainer />);

        // Wait for initial fetch
        await waitFor(() => {
            expect(mockSilentApi).toHaveBeenCalledTimes(1);
        });

        // Change the mock response for the second call
        const updatedConnectionInfo = {
            ...mockConnectionInfo,
            IsVpnConnection: true,
        };
        mockSilentApi.mockResolvedValueOnce(updatedConnectionInfo);

        // Trigger another fetch (e.g., by focus event)
        const focusHandler = (window.addEventListener as jest.Mock).mock.calls.find((call) => call[0] === 'focus')[1];
        focusHandler();

        await waitFor(() => {
            expect(mockSilentApi).toHaveBeenCalledTimes(2);
        });
        expect(mockStatusChanged).toHaveBeenCalled();
    });
});
