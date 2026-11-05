import { renderHook } from '@testing-library/react-hooks';

import { interval, maxPollingSteps, usePollCondition } from './usePollCondition';

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

it('should return a function', () => {
    const { result } = renderHook(() => usePollCondition());
    expect(typeof result.current).toBe('function');
});

it('should call cb maxPollingSteps times when cb always returns false', async () => {
    const { result } = renderHook(() => usePollCondition());
    const pollCondition = result.current;
    const cb = jest.fn().mockResolvedValue(false);

    void pollCondition(cb);

    await jest.runAllTimersAsync();

    expect(cb).toHaveBeenCalledTimes(maxPollingSteps);
});

it('should call cb 2 times after advancing by interval * 2', async () => {
    const { result } = renderHook(() => usePollCondition());
    const pollCondition = result.current;
    const cb = jest.fn().mockResolvedValue(false);

    void pollCondition(cb);

    await jest.advanceTimersByTimeAsync(interval * 2 - 1);

    expect(cb).toHaveBeenCalledTimes(2);
});

it('should stop polling when cb returns true', async () => {
    const { result } = renderHook(() => usePollCondition());
    const pollCondition = result.current;
    const cb = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    void pollCondition(cb);

    await jest.runAllTimersAsync();

    expect(cb).toHaveBeenCalledTimes(2);
});

it('should abort polling on unmount', async () => {
    const { result, unmount } = renderHook(() => usePollCondition());
    const pollCondition = result.current;
    const cb = jest.fn().mockResolvedValue(false);

    void pollCondition(cb);

    await jest.advanceTimersByTimeAsync(interval * 2);
    const callCountBeforeUnmount = cb.mock.calls.length;
    unmount();
    await jest.runAllTimersAsync();

    expect(cb).toHaveBeenCalledTimes(callCountBeforeUnmount);
});

it('should abort previous polling when called again', async () => {
    const { result } = renderHook(() => usePollCondition());
    const pollCondition = result.current;
    const cb1 = jest.fn().mockResolvedValue(false);
    const cb2 = jest.fn().mockResolvedValue(false);

    void pollCondition(cb1);
    await jest.advanceTimersByTimeAsync(interval * 2);

    void pollCondition(cb2);
    await jest.runAllTimersAsync();

    expect(cb2).toHaveBeenCalledTimes(maxPollingSteps);
    // cb1 was aborted partway through, so it should have fewer than maxPollingSteps calls
    expect(cb1.mock.calls.length).toBeLessThan(maxPollingSteps);
});
