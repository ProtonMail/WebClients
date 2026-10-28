import { act, renderHook } from '@testing-library/react';

import { useScheduleService } from '../../providers/ScheduleServiceContext';
import { useLumoSelector } from '../../redux/hooks';
import { selectLatestRunsByScheduleId } from '../../redux/selectors';
import { STOPPED_SCHEDULE_SNAPSHOT, type ScheduleServiceSnapshot } from '../../services/schedules/types';
import { SpaceType } from '../../types';
import { useScheduleRunState } from './useScheduleRunState';

jest.mock('../../providers/ScheduleServiceContext', () => ({ useScheduleService: jest.fn() }));
jest.mock('../../redux/hooks', () => ({ useLumoSelector: jest.fn() }));
jest.mock('../../redux/selectors', () => ({
    selectLatestRunsByScheduleId: jest.fn(),
    selectSpaceById: (id: string) => (state: { spaces: Record<string, unknown> }) => state.spaces[id],
}));

const run = {
    runId: 'run',
    scheduleId: 'schedule',
    timingRevision: 1,
    scheduledFor: '2026-10-27T09:00:00Z',
    updatedAt: '2026-10-27T09:00:00Z',
    status: 'pending' as const,
};

describe('useScheduleRunState', () => {
    beforeEach(() => {
        jest.mocked(useScheduleService).mockReturnValue(null);
        jest.mocked(useLumoSelector).mockImplementation((selector) => {
            if (selector === selectLatestRunsByScheduleId) return {};
            return selector({ spaces: {} } as never);
        });
    });

    it('allows a task behind the queue head to request an extra run, then disables it when it becomes next', () => {
        const other = { ...run, runId: 'other-run', scheduleId: 'other' };
        let snapshot: ScheduleServiceSnapshot = { ...STOPPED_SCHEDULE_SNAPSHOT, pendingRuns: [other, run] };
        jest.mocked(useScheduleService).mockReturnValue({
            subscribe: () => () => {},
            getSnapshot: () => snapshot,
        } as never);
        const { result, rerender } = renderHook(() => useScheduleRunState('schedule'));
        expect(result.current).toMatchObject({ isQueued: true, isFirstInQueue: false });
        snapshot = { ...snapshot, pendingRuns: [run, other] };
        rerender();
        expect(result.current).toMatchObject({ isQueued: true, isFirstInQueue: true });
        snapshot = { ...snapshot, unsettledRuns: [{ ...other, status: 'accepted' }] };
        rerender();
        expect(result.current).toMatchObject({ isFirstInQueue: false });
        snapshot = { ...snapshot, unsettledRuns: [{ ...other, status: 'running' }] };
        rerender();
        expect(result.current).toMatchObject({ isFirstInQueue: true });
    });
    it('works without a desktop service', () => {
        const { result } = renderHook(() => useScheduleRunState('schedule'));
        expect(result.current).toEqual({
            isRunning: false,
            isQueued: false,
            isFirstInQueue: false,
            isPaused: false,
            startedAt: undefined,
        });
    });

    it('reacts to queued, running, and finished snapshots and ignores other schedules', () => {
        let snapshot: ScheduleServiceSnapshot = { ...STOPPED_SCHEDULE_SNAPSHOT, pendingRuns: [run] };
        let notify = () => {};
        const unsubscribe = jest.fn();
        jest.mocked(useScheduleService).mockReturnValue({
            subscribe: (listener: () => void) => {
                notify = listener;
                return unsubscribe;
            },
            getSnapshot: () => snapshot,
        } as never);
        const { result, unmount } = renderHook(() => useScheduleRunState('schedule'));
        expect(result.current.isQueued).toBe(true);
        expect(result.current.isFirstInQueue).toBe(true);
        act(() => {
            snapshot = { ...snapshot, pendingRuns: [], unsettledRuns: [{ ...run, status: 'accepted' }] };
            notify();
        });
        expect(result.current.isQueued).toBe(true);
        expect(result.current.isFirstInQueue).toBe(true);
        act(() => {
            snapshot = {
                ...snapshot,
                status: 'running',
                activeRunId: run.runId,
                unsettledRuns: [{ ...run, status: 'running' }],
            };
            notify();
        });
        expect(result.current.isRunning).toBe(true);
        expect(result.current.isQueued).toBe(false);
        act(() => {
            snapshot = {
                ...snapshot,
                status: 'error',
                activeRunId: undefined,
                error: new Error('storage unavailable'),
            };
            notify();
        });
        expect(result.current.isRunning).toBe(false);
        expect(result.current.startedAt).toBeUndefined();
        act(() => {
            snapshot = {
                ...snapshot,
                status: 'running',
                activeRunId: run.runId,
                unsettledRuns: [{ ...run, scheduleId: 'other', status: 'running' }],
            };
            notify();
        });
        expect(result.current.isRunning).toBe(false);
        expect(result.current.isQueued).toBe(false);
        unmount();
        expect(unsubscribe).toHaveBeenCalled();
    });

    it('reads paused state without treating a persisted conversation as active', () => {
        jest.mocked(useLumoSelector).mockImplementation((selector) => {
            if (selector === selectLatestRunsByScheduleId) {
                return {
                    schedule: {
                        createdAt: run.updatedAt,
                        scheduleRun: { run, status: 'running', promptMessageId: 'prompt' },
                    },
                };
            }
            return selector({
                spaces: {
                    schedule: {
                        spaceType: SpaceType.Schedule,
                        schedule: { name: '', instructions: '', recurrenceRule: {} },
                        scheduleDefinition: { enabled: false },
                    },
                },
            } as never);
        });
        const { result, rerender } = renderHook(() => useScheduleRunState('schedule'));
        expect(result.current).toEqual({
            isRunning: false,
            isQueued: false,
            isFirstInQueue: false,
            isPaused: true,
            startedAt: undefined,
        });

        let snapshot: ScheduleServiceSnapshot = {
            ...STOPPED_SCHEDULE_SNAPSHOT,
            status: 'running',
            activeRunId: run.runId,
            unsettledRuns: [{ ...run, status: 'running' }],
        };
        jest.mocked(useScheduleService).mockReturnValue({
            subscribe: () => () => {},
            getSnapshot: () => snapshot,
        } as never);
        rerender();
        expect(result.current).toEqual({
            isRunning: true,
            isQueued: false,
            isFirstInQueue: false,
            isPaused: true,
            startedAt: run.updatedAt,
        });

        snapshot = {
            ...snapshot,
            activeRunId: 'different-run',
            unsettledRuns: [{ ...run, runId: 'different-run', status: 'running' }],
        };
        rerender();
        expect(result.current.isRunning).toBe(true);
        expect(result.current.startedAt).toBeUndefined();
    });
});
