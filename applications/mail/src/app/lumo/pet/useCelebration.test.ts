import { act, renderHook } from '@testing-library/react';

import { LumoChainEnd } from '@proton/llm/lib/lumoAgent/ui/types';

import { useCelebration } from './useCelebration';

const renderCelebration = (isBusy: boolean) =>
    renderHook(({ isBusy, lastChainEnd }) => useCelebration(isBusy, lastChainEnd), {
        initialProps: { isBusy, lastChainEnd: null as LumoChainEnd | null },
    });

describe('useCelebration', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('celebrates for 2s once Lumo finishes with a reply, then stops', () => {
        const { result, rerender } = renderCelebration(true);
        expect(result.current).toBe(false);

        rerender({ isBusy: false, lastChainEnd: LumoChainEnd.SUCCEEDED });
        expect(result.current).toBe(true);

        act(() => jest.advanceTimersByTime(1999));
        expect(result.current).toBe(true);
        act(() => jest.advanceTimersByTime(1));
        expect(result.current).toBe(false);
    });

    it.each([LumoChainEnd.FAILED, LumoChainEnd.STOPPED, LumoChainEnd.DISCARDED])(
        'does not celebrate a turn that ended %s',
        (end) => {
            const { result, rerender } = renderCelebration(true);

            rerender({ isBusy: false, lastChainEnd: end });

            expect(result.current).toBe(false);
        }
    );

    it('does not celebrate when the turn is abandoned before it reports, nor when the report lands after', () => {
        const { result, rerender } = renderCelebration(true);

        rerender({ isBusy: false, lastChainEnd: null });
        expect(result.current).toBe(false);

        rerender({ isBusy: false, lastChainEnd: LumoChainEnd.SUCCEEDED });
        expect(result.current).toBe(false);
    });

    it('does not celebrate when mounted idle', () => {
        const { result } = renderCelebration(false);

        expect(result.current).toBe(false);
    });

    it('stops at once when Lumo starts working again mid-celebration', () => {
        const { result, rerender } = renderCelebration(true);
        rerender({ isBusy: false, lastChainEnd: LumoChainEnd.SUCCEEDED });

        rerender({ isBusy: true, lastChainEnd: null });

        expect(result.current).toBe(false);
    });
});
