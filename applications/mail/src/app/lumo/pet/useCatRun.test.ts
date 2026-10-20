import { act, renderHook } from '@testing-library/react';

import { PanelSide } from '../floating/panelSide';
import { CatRun } from './catPose';
import { SKID_LEAD_MS, useCatRun } from './useCatRun';

const RUN_MS = 1000;

const renderRun = (canRun = true) =>
    renderHook((props) => useCatRun(props), { initialProps: { side: PanelSide.RIGHT, canRun, runMs: RUN_MS } });

describe('useCatRun', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('gallops, skids before arrival, then stops when the glide ends', () => {
        const { result, rerender } = renderRun();

        rerender({ side: PanelSide.LEFT, canRun: true, runMs: RUN_MS });
        expect(result.current).toMatchObject({ shownSide: PanelSide.LEFT, run: CatRun.GALLOP });

        act(() => jest.advanceTimersByTime(RUN_MS - SKID_LEAD_MS - 1));
        expect(result.current.run).toBe(CatRun.GALLOP);
        act(() => jest.advanceTimersByTime(1));
        expect(result.current.run).toBe(CatRun.SKID);

        act(() => result.current.endGlide());
        expect(result.current.run).toBeNull();
    });

    it('stops on its own at the run time when no glide end arrives', () => {
        const { result, rerender } = renderRun();
        rerender({ side: PanelSide.LEFT, canRun: true, runMs: RUN_MS });

        act(() => jest.advanceTimersByTime(RUN_MS - 1));
        expect(result.current.run).toBe(CatRun.SKID);
        act(() => jest.advanceTimersByTime(1));
        expect(result.current.run).toBeNull();
    });

    it('stops at once for a zero-length run', () => {
        const { result, rerender } = renderHook((props) => useCatRun(props), {
            initialProps: { side: PanelSide.RIGHT, canRun: true, runMs: 0 },
        });
        rerender({ side: PanelSide.LEFT, canRun: true, runMs: 0 });

        act(() => jest.advanceTimersByTime(0));

        expect(result.current.run).toBeNull();
    });

    it('times the end afresh when the side flips back mid-run', () => {
        const { result, rerender } = renderRun();
        rerender({ side: PanelSide.LEFT, canRun: true, runMs: RUN_MS });
        act(() => jest.advanceTimersByTime(RUN_MS - 1));

        rerender({ side: PanelSide.RIGHT, canRun: true, runMs: RUN_MS });
        act(() => jest.advanceTimersByTime(1));
        expect(result.current.run).not.toBeNull();

        act(() => jest.advanceTimersByTime(RUN_MS));
        expect(result.current.run).toBeNull();
    });

    it('times the skid afresh when the side flips back mid-gallop', () => {
        const { result, rerender } = renderRun();
        rerender({ side: PanelSide.LEFT, canRun: true, runMs: RUN_MS });
        act(() => jest.advanceTimersByTime(RUN_MS - SKID_LEAD_MS - 1));

        rerender({ side: PanelSide.RIGHT, canRun: true, runMs: RUN_MS });
        act(() => jest.advanceTimersByTime(1));
        expect(result.current.run).toBe(CatRun.GALLOP);

        act(() => jest.advanceTimersByTime(RUN_MS - SKID_LEAD_MS - 1));
        expect(result.current.run).toBe(CatRun.SKID);
    });

    it('moves without running when it cannot run', () => {
        const { result, rerender } = renderRun(false);

        rerender({ side: PanelSide.LEFT, canRun: false, runMs: RUN_MS });

        expect(result.current).toMatchObject({ shownSide: PanelSide.LEFT, run: null });
    });

    it('stops mid-run when running is no longer possible', () => {
        const { result, rerender } = renderRun();
        rerender({ side: PanelSide.LEFT, canRun: true, runMs: RUN_MS });

        rerender({ side: PanelSide.LEFT, canRun: false, runMs: RUN_MS });

        expect(result.current.run).toBeNull();
    });
});
