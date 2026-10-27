import { attachScheduleDebug } from './developmentDebug';
import type { ScheduleRunResult, ScheduleServiceSnapshot } from './types';

const result: ScheduleRunResult = {
    run: {
        runId: 'saved-run',
        scheduleId: 'saved-task',
        timingRevision: 1,
        scheduledFor: '2026-10-19T01:00:00Z',
        status: 'running',
        updatedAt: '2026-10-19T01:00:00Z',
    },
    outcome: 'succeeded',
    producedTurns: [],
    finishedAt: '2026-10-19T01:01:00Z',
};
// Use the application's existing JSDOM environment; only isolate the property under test.
let previousDebug: typeof window.LumoScheduleDebug;
beforeEach(() => {
    previousDebug = window.LumoScheduleDebug;
    delete window.LumoScheduleDebug;
});
afterEach(() => {
    if (previousDebug) window.LumoScheduleDebug = previousDebug;
    else delete window.LumoScheduleDebug;
});
function setup() {
    let current = true;
    const snapshot: ScheduleServiceSnapshot = { status: 'ready', pendingRuns: [], unsettledRuns: [] };
    const service = { getSnapshot: () => snapshot, refresh: jest.fn(async () => {}) };
    const results = {
        getResult: jest.fn(async (_id: string) => result),
        listResults: jest.fn(async () => [result]),
    };
    const detach = attachScheduleDebug({ service, results, isCurrentAccount: () => current });
    return {
        service,
        results,
        detach,
        controls: window.LumoScheduleDebug!,
        expire: () => {
            current = false;
        },
    };
}

test('retrieves persisted results without fixture data or session-local run tracking', async () => {
    const h = setup();
    expect(await h.controls.result()).toEqual(result);
    expect(await h.controls.runs()).toEqual([
        { runId: 'saved-run', scheduleId: 'saved-task', outcome: 'succeeded', finishedAt: result.finishedAt },
    ]);
    expect(await h.controls.result('saved-run')).toEqual(result);
    expect(h.results.getResult).toHaveBeenCalledWith('saved-run');
    h.detach();
});
test('cleanup removes the helper and invalidates references retained by the console', async () => {
    const h = setup();
    h.detach();
    expect(window.LumoScheduleDebug).toBeUndefined();
    expect(() => h.controls.status()).toThrow('Schedule debugging context expired');
    await expect(h.controls.result()).rejects.toMatchObject({ name: 'AbortError' });
    expect(h.results.listResults).not.toHaveBeenCalled();
});
test('account changes during a read prevent returning the previous account result', async () => {
    const h = setup();
    let resolve!: (value: ScheduleRunResult[]) => void;
    h.results.listResults.mockImplementation(
        () =>
            new Promise((done) => {
                resolve = done;
            })
    );
    const read = h.controls.result();
    h.expire();
    resolve([result]);
    await expect(read).rejects.toMatchObject({ name: 'AbortError' });
    h.detach();
});
