import { act, renderHook } from '@testing-library/react';

import { useTypingActivity } from './useTypingActivity';

describe('useTypingActivity', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('stays typing until 1.5s after the last keystroke', () => {
        const { result } = renderHook(() => useTypingActivity());
        expect(result.current.isTyping).toBe(false);

        act(() => result.current.noteKeystroke());
        act(() => jest.advanceTimersByTime(1000));
        act(() => result.current.noteKeystroke());
        act(() => jest.advanceTimersByTime(1000));
        expect(result.current.isTyping).toBe(true);

        act(() => jest.advanceTimersByTime(500));
        expect(result.current.isTyping).toBe(false);
    });
});
