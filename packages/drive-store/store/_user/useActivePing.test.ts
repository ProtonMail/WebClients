import { renderHook } from '@testing-library/react-hooks';

import { ACTIVE_PING_INTERVAL } from '@proton/shared/lib/drive/constants';

import { LAST_ACTIVE_PING, useActivePing } from './useActivePing';

const mockedApi = jest.fn();
const mockedUser = { ID: 123 };

jest.mock('@proton/components/hooks', () => ({
    useApi: () => jest.fn().mockImplementation(mockedApi.mockResolvedValue('')),
    useUser: () => [mockedUser],
}));

describe('useActivePing', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        window.localStorage.clear();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('call the api immediately', async () => {
        renderHook(() => useActivePing());
        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('call the api periodically based on the interval', async () => {
        const interval = 1000;
        const { waitFor } = renderHook(() => useActivePing(interval));

        jest.advanceTimersByTime(interval);

        await waitFor(() => expect(mockedApi).toHaveBeenCalledTimes(2));
    });

    it('does not call api if interval time has not passed since last ping', () => {
        const interval = 10000;

        const { rerender } = renderHook(() => useActivePing(interval));

        jest.advanceTimersByTime(interval / 2);

        rerender();

        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('call api again if interval has passed since last ping', () => {
        const interval = 10000;

        const { rerender } = renderHook(() => useActivePing(interval));
        jest.advanceTimersByTime(interval / 2);
        rerender(interval);

        expect(mockedApi).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(interval / 2);
        rerender(interval);

        expect(mockedApi).toHaveBeenCalledTimes(2);
    });

    it('call api only when document.visibilityState === visible', () => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
        renderHook(() => useActivePing());
        expect(mockedApi).toHaveBeenCalledTimes(0);
    });

    it("call api when document.visibilityState === visible and you're passed the interval time", () => {
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
        renderHook(() => useActivePing());
        expect(mockedApi).toHaveBeenCalledTimes(0);

        Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('remove previously stored LAST_ACTIVE_PING value if user changes and data is expired', () => {
        const { rerender } = renderHook(() => useActivePing());
        expect(mockedApi).toHaveBeenCalledTimes(1);
        expect(Object.keys(localStorage).filter((k) => k.startsWith(LAST_ACTIVE_PING)).length).toEqual(1);
        // change user ID
        mockedUser.ID = 456;
        // Expired
        const originalDateNow = Date.now();
        Date.now = jest.fn(() => originalDateNow + ACTIVE_PING_INTERVAL + 1);
        rerender();
        expect(Object.keys(localStorage).filter((k) => k.startsWith(LAST_ACTIVE_PING)).length).toEqual(1);
    });
});
