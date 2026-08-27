import type { Task } from 'redux-saga';
import { runSaga } from 'redux-saga';

import { obfuscate } from '../../../utils/obfuscate/xor';
import { requestCancel } from '../../request/actions';
import { sagaSetup } from '../testing';
import compromisedPasswordsFullCheck from './compromised-passwords-full-check.saga';

const checkPasswordCompromised = jest.fn();
const getLastChangeTimestamp = jest.fn();

jest.mock('../../../lib/monitor/compromised-password.request', () => ({
    checkPasswordCompromised: (...args: unknown[]) => checkPasswordCompromised(...args),
    getLastChangeTimestamp: (...args: unknown[]) => getLastChangeTimestamp(...args),
}));

let featureEnabled = true;
let plan: 'free' | 'plus' = 'plus';
let logins: any[] = [];
let cache: Record<string, any> = {};
let lastSyncedChange = 0;

jest.mock('../../selectors', () => ({
    ...jest.requireActual('../../selectors'),
    selectFeatureFlag: () => () => featureEnabled,
    selectPassPlan: () => plan,
    selectMonitoredLogins: () => () => logins,
    selectCompromisedPasswordsCache: () => cache,
    selectLastSyncedChange: () => lastSyncedChange,
}));

jest.mock('../../../lib/user/user.predicates', () => ({ isPaidPlan: (p: string) => p !== 'free' }));

const loginItem = (shareId: string, itemId: string, password: string, revision = 1) => ({
    shareId,
    itemId,
    revision,
    data: { type: 'login', content: { password: obfuscate(password), autofillUrls: [] } },
});

describe('compromisedPasswordsFullCheck saga', () => {
    let saga: ReturnType<typeof sagaSetup>;
    let dispatch: (action: any) => void;
    let task: Task;

    beforeEach(() => {
        jest.clearAllMocks();
        featureEnabled = true;
        plan = 'plus';
        logins = [];
        cache = {};
        lastSyncedChange = 0;
        getLastChangeTimestamp.mockResolvedValue(1234);
        checkPasswordCompromised.mockResolvedValue({ status: 'checked', compromised: false, etag: 'etag' });

        saga = sagaSetup({});
        task = runSaga(saga.options, compromisedPasswordsFullCheck, {} as any);
        dispatch = saga.options.dispatch;
    });

    afterEach(() => task.cancel());

    const findAction = (pred: (action: any) => boolean): any => saga.dispatched.find(pred);

    const intent = (dto: { shareIds?: string[]; tabId?: number; generation?: number } = {}) =>
        dispatch({
            type: 'monitor::compromised-passwords::check::intent',
            payload: dto,
            meta: {
                request: {
                    status: 'start',
                    id: `monitor::compromised-passwords::check::${dto.tabId ?? 0}::${dto.generation ?? 0}`,
                    async: false,
                },
            },
        });

    it('returns [] and never calls the network when the feature flag is disabled', async () => {
        featureEnabled = false;
        logins = [loginItem('s1', 'i1', 'hunter2')];
        intent();
        await saga.nextTick();

        expect(checkPasswordCompromised).not.toHaveBeenCalled();
        const success = findAction((a) => a.type.endsWith('::success'));
        expect(success?.payload).toEqual([]);
    });

    it('returns [] and never calls the network on a free plan', async () => {
        plan = 'free';
        logins = [loginItem('s1', 'i1', 'hunter2')];
        intent();
        await saga.nextTick();

        expect(checkPasswordCompromised).not.toHaveBeenCalled();
        const success = findAction((a) => a.type.endsWith('::success'));
        expect(success?.payload).toEqual([]);
    });

    it('skips the network entirely when the cache is fully fresh', async () => {
        const item = loginItem('s1', 'i1', 'hunter2', 5);
        logins = [item];
        lastSyncedChange = 1234;
        cache = { 's1::i1': { compromised: true, etag: 'etag', revision: 5 } };
        getLastChangeTimestamp.mockResolvedValue(1234);

        intent();
        await saga.nextTick();

        expect(checkPasswordCompromised).not.toHaveBeenCalled();
        const success = findAction((a) => a.type.endsWith('::success'));
        expect(success?.payload).toEqual([{ shareId: 's1', itemId: 'i1' }]);
    });

    it('checks each unique password once, deduping items that share a password', async () => {
        logins = [loginItem('s1', 'i1', 'hunter2'), loginItem('s1', 'i2', 'hunter2'), loginItem('s1', 'i3', 'other')];
        checkPasswordCompromised.mockResolvedValue({ status: 'checked', compromised: true, etag: 'etag' });

        intent();
        await saga.nextTick();
        await saga.nextTick();

        expect(checkPasswordCompromised).toHaveBeenCalledTimes(2);
        const batch = findAction((a) => a.type === 'monitor::compromised-passwords::batch-update');
        expect(batch?.payload).toHaveLength(3);
        const sync = findAction((a) => a.type === 'monitor::compromised-passwords::sync');
        expect(sync?.payload.results).toHaveLength(3);
    });

    it('never re-checks a password already known to be compromised', async () => {
        const item = loginItem('s1', 'i1', 'hunter2', 3);
        logins = [item];
        lastSyncedChange = 1234;
        getLastChangeTimestamp.mockResolvedValue(5678); // corpus changed since last sync
        cache = { 's1::i1': { compromised: true, etag: 'etag', revision: 3 } };

        intent();
        await saga.nextTick();
        await saga.nextTick();

        expect(checkPasswordCompromised).not.toHaveBeenCalled();
        const sync = findAction((a) => a.type === 'monitor::compromised-passwords::sync');
        expect(sync?.payload.results[0].entry.compromised).toBe(true);
    });

    it('reuses the cached entry on a 304/not-modified response instead of overwriting it', async () => {
        const item = loginItem('s1', 'i1', 'hunter2', 3);
        logins = [item];
        lastSyncedChange = 1234;
        getLastChangeTimestamp.mockResolvedValue(5678);
        cache = { 's1::i1': { compromised: false, etag: 'cached-etag', revision: 3 } };
        checkPasswordCompromised.mockResolvedValue({ status: 'not-modified' });

        intent();
        await saga.nextTick();
        await saga.nextTick();

        expect(checkPasswordCompromised).toHaveBeenCalledWith('hunter2', 'cached-etag', expect.anything());
        const batch = findAction((a) => a.type === 'monitor::compromised-passwords::batch-update');
        expect(batch?.payload[0].entry).toMatchObject({ compromised: false, etag: 'cached-etag' });
    });

    it('does not sync when a password check fails, but keeps other results', async () => {
        logins = [loginItem('s1', 'i1', 'good'), loginItem('s1', 'i2', 'bad')];
        checkPasswordCompromised.mockImplementation(async (password: string) => {
            if (password === 'bad') throw new Error('network error');
            return { status: 'checked', compromised: false, etag: 'etag' };
        });

        intent();
        await saga.nextTick();
        await saga.nextTick();

        const sync = findAction((a) => a.type === 'monitor::compromised-passwords::sync');
        expect(sync).toBeUndefined();
        const batch = findAction((a) => a.type === 'monitor::compromised-passwords::batch-update');
        expect(batch?.payload).toHaveLength(1);
    });

    it('always resets progress to zero once the run terminates', async () => {
        logins = [loginItem('s1', 'i1', 'hunter2')];
        intent();
        await saga.nextTick();
        await saga.nextTick();

        const progressActions: any[] = saga.dispatched.filter((a: any) => a.type === 'monitor::compromised-passwords::progress');
        expect(progressActions.at(-1)?.payload).toEqual({ completed: 0, total: 0 });
    });

    it('aborts the in-flight check when the request is cancelled', async () => {
        let aborted = false;
        logins = [loginItem('s1', 'i1', 'hunter2')];
        checkPasswordCompromised.mockImplementation((_password: string, _etag: unknown, signal: AbortSignal) => {
            return new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => {
                    aborted = true;
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });
        });

        intent();
        await saga.nextTick();
        dispatch(requestCancel('monitor::compromised-passwords::check::0::0'));
        await saga.nextTick();
        await saga.nextTick();

        expect(aborted).toBe(true);
        const failure = findAction((a) => a.type.endsWith('::failure'));
        expect(failure).toBeDefined();
    });

    it('persists already-completed results before tearing down on cancellation', async () => {
        logins = [loginItem('s1', 'i1', 'done'), loginItem('s1', 'i2', 'hangs')];
        checkPasswordCompromised.mockImplementation((password: string, _etag: unknown, signal: AbortSignal) => {
            if (password === 'done') return Promise.resolve({ status: 'checked', compromised: true, etag: 'etag' });
            return new Promise((_resolve, reject) => {
                signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
            });
        });

        intent();
        await saga.nextTick();
        await saga.nextTick();
        dispatch(requestCancel('monitor::compromised-passwords::check::0::0'));
        await saga.nextTick();
        await saga.nextTick();

        const batch = findAction((a) => a.type === 'monitor::compromised-passwords::batch-update');
        expect(batch?.payload).toEqual([expect.objectContaining({ item: { shareId: 's1', itemId: 'i1' } })]);
        // the authoritative full sync must NOT fire on a cancelled/partial run
        expect(findAction((a) => a.type === 'monitor::compromised-passwords::sync')).toBeUndefined();
    });
});
