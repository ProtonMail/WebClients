import { renderHook } from '@testing-library/react-hooks';

import { useActivePing } from './useActivePing';

const mockedApi = jest.fn();
jest.mock('@proton/components/hooks', () => ({
    useApi: () => jest.fn().mockImplementation(mockedApi.mockResolvedValue('')),
}));

describe('useActivePing', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
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
        const initialTime = 30000;
        const interval = 10000;
        const mockedGetTime = jest.fn().mockReturnValue(30000);
        // @ts-ignore
        jest.spyOn(global, 'Date').mockImplementation(() => ({
            getTime: mockedGetTime,
        }));

        const { rerender } = renderHook(() => useActivePing(interval));
        mockedGetTime.mockReturnValue(initialTime + interval / 2);
        rerender();

        expect(mockedApi).toHaveBeenCalledTimes(1);
    });

    it('call api again if interval has passed since last ping', () => {
        const initialTime = 30000;
        const interval = 10000;
        const mockedGetTime = jest.fn().mockReturnValue(initialTime);
        // @ts-ignore
        jest.spyOn(global, 'Date').mockImplementation(() => ({
            getTime: mockedGetTime,
        }));

        const { rerender } = renderHook(() => useActivePing(interval));
        mockedGetTime.mockReturnValue(initialTime + interval * 2);

        rerender(interval);

        expect(mockedApi).toHaveBeenCalledTimes(2);
    });
});
