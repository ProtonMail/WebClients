import { act, renderHook } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import type { ParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
import { selectParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
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

const renderStages = (mismatch: ParticipantCountMismatch | null, { isGuest = false } = {}) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, isGuest],
        [selectParticipantCountMismatch, mismatch],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));
    vi.mocked(useFlag).mockImplementation((flag) => flag === 'MeetParticipantCountMismatch');

    const renderedStages: MismatchStage[] = [];
    const { result, rerender } = renderHook(() => {
        const stage = useMismatchStage();
        renderedStages.push(stage);
        return stage;
    });

    const setMismatch = (nextMismatch: ParticipantCountMismatch | null) => {
        selectedValues.set(selectParticipantCountMismatch, nextMismatch);
        rerender();
    };

    return { result, renderedStages, setMismatch };
};

const advanceTime = (milliseconds: number) => {
    act(() => {
        vi.advanceTimersByTime(milliseconds);
    });
};

describe('useMismatchStage', () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('with the host in the call', () => {
        it('is already at the warning stage on the first render of a mismatch older than a minute', () => {
            const { renderedStages } = renderStages({ since: NOW - 2 * MINUTE, isHostInCall: true });

            expect(renderedStages[0]).toBe(MismatchStage.Warning);
        });

        it('is at the info stage on the first render of a mismatch between 30 seconds and a minute old', () => {
            const { renderedStages } = renderStages({ since: NOW - 45 * SECOND, isHostInCall: true });

            expect(renderedStages[0]).toBe(MismatchStage.Info);
        });

        it('starts hidden and moves to info at 30 seconds and to warning at a minute', () => {
            const { result } = renderStages({ since: NOW, isHostInCall: true });
            expect(result.current).toBe(MismatchStage.Hidden);

            advanceTime(30 * SECOND - 1);
            expect(result.current).toBe(MismatchStage.Hidden);

            advanceTime(1);
            expect(result.current).toBe(MismatchStage.Info);

            advanceTime(30 * SECOND - 1);
            expect(result.current).toBe(MismatchStage.Info);

            advanceTime(1);
            expect(result.current).toBe(MismatchStage.Warning);
        });

        it('never warns when the counts match again after 59 seconds', () => {
            const { result, renderedStages, setMismatch } = renderStages({ since: NOW, isHostInCall: true });

            advanceTime(59 * SECOND);
            setMismatch(null);
            advanceTime(5 * MINUTE);

            expect(result.current).toBe(MismatchStage.Hidden);
            expect(renderedStages).not.toContain(MismatchStage.Warning);
        });

        it('is hidden on the very next render once a warning mismatch clears', () => {
            const { renderedStages, setMismatch } = renderStages({ since: NOW - 2 * MINUTE, isHostInCall: true });

            setMismatch(null);

            expect(renderedStages).toEqual([MismatchStage.Warning, MismatchStage.Hidden]);
        });
    });

    describe('without the host in the call', () => {
        it('starts hidden and shows the host-away stage at 30 seconds', () => {
            const { result } = renderStages({ since: NOW, isHostInCall: false });
            expect(result.current).toBe(MismatchStage.Hidden);

            advanceTime(30 * SECOND - 1);
            expect(result.current).toBe(MismatchStage.Hidden);

            advanceTime(1);
            expect(result.current).toBe(MismatchStage.HostAway);
        });

        it('never warns, even after 5 minutes', () => {
            const { result, renderedStages } = renderStages({ since: NOW, isHostInCall: false });

            advanceTime(5 * MINUTE);

            expect(result.current).toBe(MismatchStage.HostAway);
            expect(renderedStages).not.toContain(MismatchStage.Warning);
        });

        it('clears the warning at once when the host leaves', () => {
            const { renderedStages, setMismatch } = renderStages({ since: NOW - 2 * MINUTE, isHostInCall: true });

            setMismatch({ since: NOW, isHostInCall: false });

            expect(renderedStages).toEqual([MismatchStage.Warning, MismatchStage.Hidden]);
        });
    });

    it('stays hidden for a guest, after any wait', () => {
        const { result, renderedStages } = renderStages({ since: NOW, isHostInCall: true }, { isGuest: true });

        advanceTime(5 * MINUTE);

        expect(result.current).toBe(MismatchStage.Hidden);
        expect(renderedStages).not.toContain(MismatchStage.Warning);
    });

    it('stays hidden without a mismatch', () => {
        const { result } = renderStages(null);

        advanceTime(2 * MINUTE);

        expect(result.current).toBe(MismatchStage.Hidden);
    });
});
