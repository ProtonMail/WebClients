import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';

import { ScheduleServiceContext } from '../../providers/ScheduleServiceContext';
import type { ScheduleService } from '../../services/schedules/ScheduleService';
import type { ScheduleServiceSnapshot } from '../../services/schedules/types';
import { useRunScheduleNow } from './useRunScheduleNow';

const push = jest.fn();
const createNotification = jest.fn();
let conversations: Record<string, { id: string }> = {};
jest.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }));
jest.mock('@proton/account/user/hooks', () => ({ useUser: () => [{ ID: 'alice' }] }));
jest.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification }) }));
jest.mock('../../redux/hooks', () => ({
    useLumoSelector: (select: (state: unknown) => unknown) => select({ conversations }),
}));
jest.mock('../../services/schedules/ConversationScheduleRunRepository', () => ({
    scheduleConversationId: () => 'new-conversation',
}));

function harness(available = true) {
    const run: ScheduleRun = {
        runId: 'manual-run',
        scheduleId: 'summary',
        status: 'pending',
        timingRevision: 1,
        scheduledFor: '2026-10-28T00:00:00Z',
        updatedAt: '2026-10-28T00:00:00Z',
    };
    let snapshot: ScheduleServiceSnapshot = { status: 'ready', pendingRuns: [], unsettledRuns: [] };
    const runNow = jest.fn(async () => {
        snapshot = { ...snapshot, pendingRuns: [run] };
        return run;
    });
    const service = { subscribe: () => () => {}, getSnapshot: () => snapshot, runNow } as unknown as ScheduleService;
    const wrapper = ({ children }: { children: ReactNode }) => (
        <ScheduleServiceContext.Provider value={available ? service : null}>{children}</ScheduleServiceContext.Provider>
    );
    return { ...renderHook(() => useRunScheduleNow('summary'), { wrapper }), runNow, service };
}

beforeEach(() => {
    jest.clearAllMocks();
    conversations = {};
});

it('disables manual execution without the desktop service', () => {
    const h = harness(false);
    expect(h.result.current.disabled).toBe(true);
});

it('prevents duplicate clicks and opens the saved run with its history expanded', async () => {
    const h = harness();
    await act(async () => {
        await Promise.all([h.result.current.runNow(), h.result.current.runNow()]);
    });
    expect(h.runNow).toHaveBeenCalledTimes(1);
    expect(h.runNow).toHaveBeenCalledWith('summary');
    expect(h.result.current.loading).toBe(true);
    expect(push).not.toHaveBeenCalled();
    conversations = { 'new-conversation': { id: 'new-conversation' } };
    h.rerender();
    expect(push).toHaveBeenCalledWith({ pathname: '/c/new-conversation', state: { expandedScheduleRuns: 'summary' } });
    expect(h.result.current.loading).toBe(false);
});

it('clears loading and reports a queue failure so the user can retry', async () => {
    const h = harness();
    h.runNow.mockRejectedValueOnce(new Error('disk unavailable'));
    await act(async () => {
        await h.result.current.runNow();
    });
    expect(h.result.current.loading).toBe(false);
    expect(h.result.current.disabled).toBe(false);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(push).not.toHaveBeenCalled();
});
