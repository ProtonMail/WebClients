import { useHistory, useLocation } from 'react-router-dom';

import { act, renderHook } from '@testing-library/react-hooks';

import useSearchParams from './useSearchParams';

// Mocking dependencies like useLocation and useHistory
jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
    useHistory: jest.fn(),
}));

describe('useSearchParams', () => {
    const mockUseLocation = useLocation as jest.Mock;
    const mockUseHistory = useHistory as jest.Mock;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    it('should set search params correctly', () => {
        mockUseLocation.mockReturnValueOnce({ pathname: '/path', hash: '' });
        const mockPush = jest.fn();
        mockUseHistory.mockReturnValueOnce({ push: mockPush });

        const { result } = renderHook(() => useSearchParams());

        act(() => {
            const [, setSearchParams] = result.current;
            setSearchParams({ key: 'value' });
        });

        expect(mockPush).toHaveBeenCalledWith('/path#key=value');
    });

    it('should update search params correctly', () => {
        // Mock initial location
        mockUseLocation.mockReturnValueOnce({ pathname: '/path', hash: '#key1=value1&key2=value2' });
        const mockPush = jest.fn();
        mockUseHistory.mockReturnValueOnce({ push: mockPush });

        // Render the hook
        const { result } = renderHook(() => useSearchParams());

        // Destructure setSearchParams from the hook result
        const [, setSearchParams] = result.current;

        // Update the search params
        act(() => {
            setSearchParams({ key2: 'updatedValue' });
        });

        // Assert that history.push is called with the correct updated route
        expect(mockPush).toHaveBeenCalledWith('/path#key1=value1&key2=updatedValue');
    });

    it('should update search params with function correctly', () => {
        mockUseLocation.mockReturnValueOnce({ pathname: '/path', hash: '#key1=value1' });
        const mockPush = jest.fn();
        mockUseHistory.mockReturnValueOnce({ push: mockPush });

        const { result } = renderHook(() => useSearchParams());

        act(() => {
            const [, setSearchParams] = result.current;
            setSearchParams((params) => ({ ...params, key2: 'value2' }));
        });

        expect(mockPush).toHaveBeenCalledWith('/path#key1=value1&key2=value2');
    });

    it('should handle init prop correctly', () => {
        const initParams = { key1: 'value1', key2: 'value2' };

        mockUseLocation.mockReturnValueOnce({ pathname: '/path', hash: '#key1=value1' });
        const mockPush = jest.fn();
        mockUseHistory.mockReturnValueOnce({ push: mockPush });

        renderHook(() => useSearchParams(initParams));

        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/path#key1=value1&key2=value2');
    });

    it('should handle init prop with undefined correctly', () => {
        mockUseLocation.mockReturnValueOnce({ pathname: '/path', hash: '#key1=value1' });
        const mockPush = jest.fn();
        mockUseHistory.mockReturnValueOnce({ push: mockPush });

        renderHook(() => useSearchParams(undefined));

        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle unmounting correctly', () => {
        mockUseLocation.mockReturnValueOnce({ pathname: '/path', hash: '#key1=value1' });
        const mockPush = jest.fn();
        mockUseHistory.mockReturnValueOnce({ push: mockPush });

        const { unmount } = renderHook(() => useSearchParams());

        // Assert that setSearchParams is not called when the component is unmounted
        unmount();
        expect(mockPush).not.toHaveBeenCalled();
    });
});
