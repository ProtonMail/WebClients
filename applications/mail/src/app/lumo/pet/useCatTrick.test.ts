import { act, renderHook } from '@testing-library/react';

import { CatTrick } from './catPose';
import { CAT_TRICK_MS } from './catSpriteManifest';
import { useCatTrick } from './useCatTrick';

const renderTrick = (canPlay = true) =>
    renderHook(({ canPlay }) => useCatTrick(canPlay), { initialProps: { canPlay } });

describe('useCatTrick', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('plays the trick for its length, then stops', () => {
        const { result } = renderTrick();

        act(() => result.current.playTrick(CatTrick.NINE_LIVES));
        expect(result.current.trick).toBe(CatTrick.NINE_LIVES);

        act(() => jest.advanceTimersByTime(CAT_TRICK_MS[CatTrick.NINE_LIVES] - 1));
        expect(result.current.trick).toBe(CatTrick.NINE_LIVES);
        act(() => jest.advanceTimersByTime(1));
        expect(result.current.trick).toBeNull();
    });

    it('ignores a trick it cannot play', () => {
        const { result } = renderTrick(false);

        act(() => result.current.playTrick(CatTrick.ENCRYPT));

        expect(result.current.trick).toBeNull();
    });

    it('stops mid-trick when playing is no longer possible', () => {
        const { result, rerender } = renderTrick();
        act(() => result.current.playTrick(CatTrick.SCHRODINGER_IN_BOX));

        rerender({ canPlay: false });

        expect(result.current.trick).toBeNull();
    });
});
