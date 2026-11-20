import { act, renderHook } from '@testing-library/react';

import { useTypingActivity } from './useTypingActivity';

describe('useTypingActivity', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('stays typing until 1.5s after the last keystroke', () => {
        const { result } = renderHook(() => useTypingActivity());
        expect(result.current.isTyping).toBe(false);

        act(() => result.current.noteKeystroke());
        act(() => vi.advanceTimersByTime(1000));
        act(() => result.current.noteKeystroke());
        act(() => vi.advanceTimersByTime(1000));
        expect(result.current.isTyping).toBe(true);

        act(() => vi.advanceTimersByTime(500));
        expect(result.current.isTyping).toBe(false);
    });
});
