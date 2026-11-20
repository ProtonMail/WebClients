import { act, renderHook } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantCountMismatchSince } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { MismatchStage, useMismatchStage } from './useMismatchStage';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const NOW = new Date('2026-11-20T12:00:00Z').getTime();

const renderStages = (mismatchSince: number | null) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, false],
        [selectParticipantCountMismatchSince, mismatchSince],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));
    vi.mocked(useFlag).mockImplementation((flag) => flag === 'MeetParticipantCountMismatch');

    const renderedStages: MismatchStage[] = [];
    const { result } = renderHook(() => {
        const stage = useMismatchStage();
        renderedStages.push(stage);
        return stage;
    });

    return { result, renderedStages };
};

describe('useMismatchStage', () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('is already at the warning stage on the first render of a mismatch older than a minute', () => {
        const { renderedStages } = renderStages(NOW - 2 * MINUTE);

        expect(renderedStages[0]).toBe(MismatchStage.Warning);
    });

    it('is at the info stage on the first render of a mismatch between 30 seconds and a minute old', () => {
        const { renderedStages } = renderStages(NOW - 45 * SECOND);

        expect(renderedStages[0]).toBe(MismatchStage.Info);
    });

    it('starts hidden for a recent mismatch and moves to info after 30 seconds and to warning after a minute', () => {
        const { result, renderedStages } = renderStages(NOW - 10 * SECOND);

        expect(renderedStages[0]).toBe(MismatchStage.Hidden);

        act(() => vi.advanceTimersByTime(20 * SECOND));
        expect(result.current).toBe(MismatchStage.Info);

        act(() => vi.advanceTimersByTime(30 * SECOND));
        expect(result.current).toBe(MismatchStage.Warning);
    });

    it('stays hidden without a mismatch', () => {
        const { result } = renderStages(null);

        act(() => vi.advanceTimersByTime(2 * MINUTE));
        expect(result.current).toBe(MismatchStage.Hidden);
    });
});
