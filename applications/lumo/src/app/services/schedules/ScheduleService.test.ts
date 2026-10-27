import type {
    DesktopSchedulesApi,
    ScheduleDefinition,
    ScheduleRun,
    ScheduleWorkAvailable,
} from '@proton/lumo-api-client/core/desktop-schedules';

import { ScheduleService } from './ScheduleService';
import { type ScheduleExecutor, type ScheduleOutcome, SchedulePersistenceError, type ScheduleSource } from './types';

const definition: ScheduleDefinition = {
    id: 'summary',
    timingRevision: 1,
    enabled: true,
    timing: { kind: 'daily', time: '09:00', timezone: 'UTC' },
    missedRunPolicy: 'run_once',
};
const pendingRun: ScheduleRun = {
    runId: 'run-1',
    scheduleId: 'summary',
    timingRevision: 1,
    scheduledFor: '2026-10-15T09:00:00Z',
    status: 'pending',
    updatedAt: '2026-10-15T09:00:00Z',
};

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

function mockMethod<T extends (...args: never[]) => unknown>(
    implementation: (...args: Parameters<T>) => ReturnType<T>
) {
    return jest.fn<ReturnType<T>, Parameters<T>>(implementation);
}

const services: ScheduleService[] = [];
function harness({
    source = true,
    executor = true,
    runs = [pendingRun],
}: {
    source?: boolean;
    executor?: boolean;
    runs?: ScheduleRun[];
} = {}) {
    const records = new Map(runs.map((run) => [run.runId, { ...run }]));
    const listeners = new Set<(event: ScheduleWorkAvailable) => void>();
    const unsubscribed = jest.fn();
    let current = true;
    let connections = 0;
    const bridge: jest.Mocked<DesktopSchedulesApi> = {
        connect: mockMethod<DesktopSchedulesApi['connect']>(async () => ({
            connectionId: `connection-${++connections}`,
            protocolVersion: 1 as const,
        })),
        replaceSchedules: mockMethod<DesktopSchedulesApi['replaceSchedules']>(async () => {}),
        getPendingRuns: mockMethod<DesktopSchedulesApi['getPendingRuns']>(async () =>
            [...records.values()].filter((run) => run.status === 'pending').map((run) => ({ ...run }))
        ),
        getUnsettledRuns: mockMethod<DesktopSchedulesApi['getUnsettledRuns']>(async () =>
            [...records.values()]
                .filter((run) => ['accepted', 'running'].includes(run.status))
                .map((run) => ({ ...run }))
        ),
        reportRunStatus: mockMethod<DesktopSchedulesApi['reportRunStatus']>(async ({ runId, status }) => {
            records.get(runId)!.status = status;
        }),
        onWorkAvailable: mockMethod<DesktopSchedulesApi['onWorkAvailable']>((listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
                unsubscribed();
            };
        }),
    };
    const taskSource: jest.Mocked<ScheduleSource> = {
        list: mockMethod<ScheduleSource['list']>(async () => [{ ...definition }]),
    };
    const runExecutor: jest.Mocked<ScheduleExecutor> = {
        execute: mockMethod<ScheduleExecutor['execute']>(async () => 'succeeded' as const),
        claim: mockMethod<ScheduleExecutor['claim']>(async () => true),
        reconcile: mockMethod<ScheduleExecutor['reconcile']>(async () => undefined),
    };
    const service = new ScheduleService({
        accountId: 'alice',
        bridge,
        isCurrentAccount: () => current,
        source: source ? taskSource : undefined,
        executor: executor ? runExecutor : undefined,
        pollIntervalMs: 1_000,
    });
    services.push(service);
    return {
        bridge,
        service,
        taskSource,
        runExecutor,
        records,
        unsubscribed,
        changeAccount() {
            current = false;
        },
        notify(connectionId = `connection-${connections}`) {
            for (const listener of listeners) listener({ connectionId });
        },
    };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
    for (const service of services.splice(0)) service.stop();
    jest.useRealTimers();
});

it('connects and observes cached work without mutating it until dependencies are supplied', async () => {
    const h = harness({ source: false, executor: false });
    await h.service.start();
    expect(h.bridge.connect).toHaveBeenCalledWith({ accountId: 'alice', protocolVersion: 1 });
    expect(h.service.getSnapshot()).toMatchObject({ status: 'waiting', pendingRuns: [pendingRun] });
    expect(h.bridge.replaceSchedules).not.toHaveBeenCalled();
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    h.service.stop();
    expect(h.unsubscribed).toHaveBeenCalledTimes(1);
});

it('syncs before acknowledging work and awaits durable acceptance and running status before executing', async () => {
    const h = harness();
    h.runExecutor.execute.mockImplementation(async () => {
        expect(h.bridge.replaceSchedules).toHaveBeenCalled();
        expect(h.bridge.reportRunStatus.mock.calls.map(([call]) => call.status)).toEqual(['accepted', 'running']);
        expect(h.service.getSnapshot()).toMatchObject({ status: 'running', activeRunId: 'run-1' });
        return 'succeeded';
    });
    await h.service.start();
    expect(h.bridge.reportRunStatus.mock.calls.map(([call]) => call.status)).toEqual([
        'accepted',
        'running',
        'succeeded',
    ]);
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
    expect(h.service.getSnapshot()).toMatchObject({ status: 'ready', pendingRuns: [], unsettledRuns: [] });
});

it('never replaces schedules with an empty list after a failed source fetch', async () => {
    const h = harness();
    h.taskSource.list.mockRejectedValueOnce(new Error('offline'));
    await h.service.start();
    expect(h.service.getSnapshot().status).toBe('error');
    expect(h.bridge.replaceSchedules).not.toHaveBeenCalled();
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
});

it('preserves pending runs when only the source is configured', async () => {
    const h = harness({ executor: false });
    await h.service.start();
    expect(h.bridge.replaceSchedules).toHaveBeenCalledTimes(1);
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    expect(h.service.getSnapshot().status).toBe('waiting');
});

it('reconnects after a connection error and polls for a missed work notification', async () => {
    const h = harness({ runs: [] });
    h.bridge.getPendingRuns.mockRejectedValueOnce(new Error('connection expired'));
    await h.service.start();
    expect(h.service.getSnapshot().status).toBe('error');
    h.records.set(pendingRun.runId, { ...pendingRun });
    await jest.advanceTimersByTimeAsync(1_000);
    expect(h.bridge.connect).toHaveBeenCalledTimes(2);
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
    expect(h.bridge.reportRunStatus.mock.calls.every(([call]) => call.connectionId === 'connection-2')).toBe(true);
});

it('ignores old connection notifications and handles current notifications without re-sync loops', async () => {
    const h = harness({ runs: [] });
    await h.service.start();
    const reads = h.bridge.getPendingRuns.mock.calls.length;
    h.notify('old-connection');
    expect(h.bridge.getPendingRuns).toHaveBeenCalledTimes(reads);
    h.records.set(pendingRun.runId, { ...pendingRun });
    h.notify();
    await h.service.start(); // Wait for the already-running pump.
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
    expect(h.taskSource.list).toHaveBeenCalledTimes(1);
});

it('coalesces notifications and processes runs serially, without executing duplicate deliveries', async () => {
    const second = { ...pendingRun, runId: 'run-2' };
    const h = harness({ runs: [pendingRun, second] });
    const entered = deferred<void>();
    const result = deferred<ScheduleOutcome>();
    h.runExecutor.execute.mockImplementationOnce(async () => {
        entered.resolve();
        return result.promise;
    });
    const started = h.service.start();
    await entered.promise;
    h.notify();
    h.notify();
    h.notify();
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
    result.resolve('succeeded');
    await started;
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(2);
    h.bridge.getPendingRuns.mockResolvedValueOnce([{ ...pendingRun }]);
    await h.service.refresh();
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(2);
});

it('does not execute when native acceptance fails', async () => {
    const h = harness();
    h.bridge.reportRunStatus.mockRejectedValueOnce(new Error('disk unavailable'));
    await h.service.start();
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
    expect(h.service.getSnapshot().status).toBe('error');
});

it('reconciles accepted work after reload without executing it, and blocks overlapping runs for that schedule', async () => {
    const accepted = { ...pendingRun, status: 'running' as const };
    const h = harness({ runs: [accepted, { ...pendingRun, runId: 'run-2' }] });
    await h.service.start();
    expect(h.runExecutor.reconcile).toHaveBeenCalledTimes(1);
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
    expect(h.records.get('run-1')!.status).toBe('running');
    h.runExecutor.reconcile.mockResolvedValueOnce('succeeded');
    await h.service.refresh();
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
});

it('retries terminal reporting rather than execution when the final acknowledgment is lost', async () => {
    const h = harness();
    h.bridge.reportRunStatus.mockImplementation(async ({ runId, status }) => {
        if (status === 'succeeded' && h.bridge.connect.mock.calls.length === 1) throw new Error('lost reply');
        h.records.get(runId)!.status = status;
    });
    await h.service.start();
    expect(h.service.getSnapshot().status).toBe('error');
    await h.service.refresh();
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
    expect(h.runExecutor.reconcile).not.toHaveBeenCalled();
    expect(h.records.get('run-1')!.status).toBe('succeeded');
});

it('marks an executor exception interrupted instead of retrying potentially completed actions', async () => {
    const h = harness();
    h.runExecutor.execute.mockRejectedValueOnce(new Error('lost tool response'));
    await h.service.start();
    expect(h.records.get('run-1')!.status).toBe('interrupted');
    await h.service.refresh();
    expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
});

it('stopping aborts an active executor and suppresses late status reports', async () => {
    const h = harness();
    const entered = deferred<void>();
    const result = deferred<ScheduleOutcome>();
    let signal: AbortSignal | undefined;
    h.runExecutor.execute.mockImplementation(async (_run, context) => {
        signal = context.signal;
        entered.resolve();
        return result.promise;
    });
    const started = h.service.start();
    await entered.promise;
    h.service.stop();
    expect(signal!.aborted).toBe(true);
    result.resolve('succeeded');
    await started;
    expect(h.bridge.reportRunStatus.mock.calls.map(([call]) => call.status)).toEqual(['accepted', 'running']);
    expect(h.service.getSnapshot().status).toBe('stopped');
});

it('stale connect responses cannot replace a restarted service connection', async () => {
    const h = harness({ source: false, executor: false });
    const old = deferred<{ connectionId: string; protocolVersion: 1 }>();
    h.bridge.connect.mockReturnValueOnce(old.promise);
    const initial = h.service.start();
    h.service.stop();
    await h.service.start();
    old.resolve({ connectionId: 'old', protocolVersion: 1 });
    await initial;
    expect(h.service.getSnapshot().connectionId).toBe('connection-1');
    expect(h.bridge.getPendingRuns.mock.calls.some(([call]) => call.connectionId === 'old')).toBe(false);
});

it('an account change while source loading prevents subsequent bridge writes', async () => {
    const h = harness();
    const loading = deferred<ScheduleDefinition[]>();
    h.taskSource.list.mockReturnValueOnce(loading.promise);
    const started = h.service.start();
    await Promise.resolve();
    h.changeAccount();
    loading.resolve([definition]);
    await started;
    expect(h.bridge.replaceSchedules).not.toHaveBeenCalled();
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1_000);
    expect(h.service.getSnapshot().status).toBe('stopped');
});

it('keeps work unsettled if the executor cannot durably save its result', async () => {
    const h = harness();
    h.runExecutor.execute.mockRejectedValueOnce(new SchedulePersistenceError('storage unavailable'));
    await h.service.start();
    expect(h.records.get('run-1')!.status).toBe('running');
    expect(h.service.getSnapshot().status).toBe('error');
});

it('reserves before acknowledging a pending run', async () => {
    const h = harness();
    const reservation = deferred<boolean>();
    h.runExecutor.claim.mockReturnValue(reservation.promise);
    const started = h.service.start();
    await jest.advanceTimersByTimeAsync(0);
    expect(h.runExecutor.claim).toHaveBeenCalledTimes(1);
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
    reservation.resolve(true);
    await started;
    expect(h.records.get(pendingRun.runId)?.status).toBe('succeeded');
});

it('skips a lost reservation without reconciling or executing the winner', async () => {
    const h = harness();
    h.runExecutor.claim.mockResolvedValue(false);
    await h.service.start();
    expect(h.bridge.reportRunStatus.mock.calls.map(([request]) => request.status)).toEqual(['skipped']);
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
    expect(h.runExecutor.reconcile).not.toHaveBeenCalled();
});

it('leaves uncertain reservations pending and retries the claim instead of executing', async () => {
    const h = harness();
    h.runExecutor.claim.mockRejectedValueOnce(new SchedulePersistenceError('Response lost')).mockResolvedValue(false);
    await h.service.start();
    expect(h.records.get(pendingRun.runId)?.status).toBe('pending');
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    await h.service.refresh();
    expect(h.records.get(pendingRun.runId)?.status).toBe('skipped');
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
});

it('retries a lost skip acknowledgment without attempting the reservation again', async () => {
    const h = harness();
    h.runExecutor.claim.mockResolvedValue(false);
    h.bridge.reportRunStatus.mockRejectedValueOnce(new Error('Bridge response lost'));
    await h.service.start();
    await h.service.refresh();
    expect(h.records.get(pendingRun.runId)?.status).toBe('skipped');
    expect(h.runExecutor.claim).toHaveBeenCalledTimes(1);
});

it('continues processing other schedules when one claim repeatedly fails', async () => {
    const second = { ...pendingRun, runId: 'run-2', scheduleId: 'other' };
    const h = harness({ runs: [pendingRun, second] });
    h.taskSource.list.mockResolvedValue([definition, { ...definition, id: 'other' }]);
    h.runExecutor.claim.mockImplementation(async (run) => {
        if (run.runId === pendingRun.runId) throw new SchedulePersistenceError('Space has not synced');
        return true;
    });
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        await h.service.start();
        expect(h.records.get(pendingRun.runId)?.status).toBe('pending');
        expect(h.records.get(second.runId)?.status).toBe('succeeded');
        expect(h.service.getSnapshot()).toMatchObject({ status: 'ready', pendingRuns: [pendingRun] });
        await jest.advanceTimersByTimeAsync(1_000);
        expect(h.runExecutor.execute).toHaveBeenCalledTimes(1);
        expect(h.runExecutor.claim.mock.calls.filter(([run]) => run.runId === pendingRun.runId)).toHaveLength(2);
        expect(h.bridge.connect).toHaveBeenCalledTimes(1);
        expect(h.bridge.reportRunStatus.mock.calls.every(([call]) => call.runId === second.runId)).toBe(true);
    } finally {
        log.mockRestore();
    }
});

it('stops processing after the account changes during a failed claim', async () => {
    const h = harness({ runs: [pendingRun, { ...pendingRun, runId: 'run-2' }] });
    h.runExecutor.claim.mockImplementation(async () => {
        h.changeAccount();
        throw new DOMException('Account changed', 'AbortError');
    });
    await h.service.start();
    expect(h.runExecutor.claim).toHaveBeenCalledTimes(1);
    expect(h.bridge.reportRunStatus).not.toHaveBeenCalled();
    expect(h.runExecutor.execute).not.toHaveBeenCalled();
});
