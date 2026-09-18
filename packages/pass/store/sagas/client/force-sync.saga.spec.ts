import { runSaga } from 'redux-saga';

import { hasFoldersApi } from '../../../lib/folders/folders.requests';
import { INITIAL_FORCE_SYNC_ENTRY } from '../../../lib/sync/force-sync';
import type { ForceSyncEntry, ForceSyncStore } from '../../../lib/sync/force-sync';
import { ShareType } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { syncFailure, syncIntent, syncSuccess } from '../../actions';
import { syncRequest } from '../../actions/requests';
import { sagaSetup } from '../testing';
import { checkForForceSync } from './force-sync.saga';

jest.mock('../../../lib/folders/folders.requests', () => ({ hasFoldersApi: jest.fn() }));

const hasFolders = hasFoldersApi as jest.MockedFunction<typeof hasFoldersApi>;

const vault = (shareId: string) => ({
    shareId,
    targetType: ShareType.Vault,
    flags: 0,
    content: { name: shareId },
});

const createState = (overrides?: { enabled?: boolean; syncing?: boolean; shares?: string[] }) => {
    const { enabled = true, syncing = false, shares = ['share-1'] } = overrides ?? {};

    return {
        user: { features: { [PassFeature.PassForceSyncFolders]: enabled } },
        shares: Object.fromEntries(shares.map((id) => [id, vault(id)])),
        sharesDedupe: { dedupe: {}, dedupeAndVisible: {} },
        request: syncing ? { [syncRequest()]: { status: 'start' } } : {},
    };
};

const createStore = (initial?: Partial<ForceSyncEntry>) => {
    let entry: ForceSyncEntry = { ...INITIAL_FORCE_SYNC_ENTRY, ...initial };

    return {
        read: jest.fn(async () => entry),
        write: jest.fn(async (next: ForceSyncEntry) => {
            entry = next;
        }),
        get current() {
            return entry;
        },
    };
};

const run = async (store: ForceSyncStore, state: unknown, resolve?: (setup: Setup) => void) => {
    const setup = sagaSetup(state);
    const task = runSaga(setup.options, checkForForceSync, store);

    /** `store.read` and the folder probe are promises, so the saga needs a few
     * ticks before it reaches the `syncIntent` dispatch we want to answer. */
    for (let i = 0; i < 10 && task.isRunning(); i++) await setup.nextTick();
    resolve?.(setup);

    await task.toPromise();
    return setup;
};

type Setup = ReturnType<typeof sagaSetup>;

const dispatchedSync = (setup: Setup) => setup.dispatched.filter((action: any) => syncIntent.match(action));

describe('checkForForceSync', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        hasFolders.mockResolvedValue(true);
    });

    describe('skips without burning an attempt', () => {
        test('when already done', async () => {
            const store = createStore({ done: true });
            await run(store, createState());

            expect(store.write).not.toHaveBeenCalled();
            expect(hasFolders).not.toHaveBeenCalled();
        });

        test('when the attempt budget is exhausted', async () => {
            const store = createStore({ attempts: 10 });
            await run(store, createState());

            expect(store.write).not.toHaveBeenCalled();
            expect(hasFolders).not.toHaveBeenCalled();
        });

        test('when the last attempt is too recent', async () => {
            const store = createStore({ attempts: 1, lastAttemptAt: Date.now() });
            await run(store, createState());

            expect(store.write).not.toHaveBeenCalled();
            expect(hasFolders).not.toHaveBeenCalled();
        });

        test('when the feature flag is off', async () => {
            const store = createStore();
            await run(store, createState({ enabled: false }));

            expect(store.write).not.toHaveBeenCalled();
            expect(hasFolders).not.toHaveBeenCalled();
        });

        test('when another sync is already in flight', async () => {
            const store = createStore();
            await run(store, createState({ syncing: true }));

            expect(store.write).not.toHaveBeenCalled();
            expect(hasFolders).not.toHaveBeenCalled();
        });
    });

    test('burns the attempt before any network call', async () => {
        hasFolders.mockRejectedValue(new Error('offline'));
        const store = createStore();
        await run(store, createState());

        expect(store.current).toEqual(expect.objectContaining({ done: false, attempts: 1 }));
        expect(store.current.lastAttemptAt).toBeGreaterThan(0);
    });

    test('marks done without syncing when no vault has folders', async () => {
        hasFolders.mockResolvedValue(false);
        const store = createStore();
        const setup = await run(store, createState({ shares: ['share-1', 'share-2'] }));

        expect(hasFolders).toHaveBeenCalledTimes(2);
        expect(dispatchedSync(setup)).toHaveLength(0);
        expect(store.current).toEqual(expect.objectContaining({ done: true, attempts: 1 }));
    });

    test('stops probing at the first vault that has folders', async () => {
        const store = createStore();
        await run(store, createState({ shares: ['share-1', 'share-2', 'share-3'] }), (setup) => setup.channel.put(syncSuccess({} as any)));

        expect(hasFolders).toHaveBeenCalledTimes(1);
    });

    test('syncs and marks done on success', async () => {
        const store = createStore();
        const setup = await run(store, createState(), (s) => s.channel.put(syncSuccess({} as any)));

        expect(dispatchedSync(setup)).toHaveLength(1);
        expect(store.current).toEqual(expect.objectContaining({ done: true, attempts: 1 }));
    });

    test('keeps probing other vaults when one probe fails, and syncs on a later hit', async () => {
        hasFolders.mockRejectedValueOnce(new Error('403')).mockResolvedValueOnce(true);
        const store = createStore();
        const setup = await run(store, createState({ shares: ['share-1', 'share-2'] }), (s) => s.channel.put(syncSuccess({} as any)));

        expect(hasFolders).toHaveBeenCalledTimes(2);
        expect(dispatchedSync(setup)).toHaveLength(1);
        expect(store.current).toEqual(expect.objectContaining({ done: true }));
    });

    test('does not mark done when a probe failed and no folders were found', async () => {
        hasFolders.mockRejectedValue(new Error('403'));
        const store = createStore();
        const setup = await run(store, createState({ shares: ['share-1', 'share-2'] }));

        expect(dispatchedSync(setup)).toHaveLength(0);
        expect(store.current).toEqual(expect.objectContaining({ done: false, attempts: 1 }));
    });

    test('does not mark done when the sync fails', async () => {
        const store = createStore();
        const setup = await run(store, createState(), (s) => s.channel.put(syncFailure(new Error('nope'))));

        expect(dispatchedSync(setup)).toHaveLength(1);
        expect(store.current).toEqual(expect.objectContaining({ done: false, attempts: 1 }));
    });

    test('retries on the next call after a failure, once the interval has passed', async () => {
        const store = createStore();
        await run(store, createState(), (s) => s.channel.put(syncFailure(new Error('nope'))));
        expect(store.current.attempts).toBe(1);

        /** Immediately after, the retry interval blocks a second attempt */
        await run(store, createState());
        expect(store.current.attempts).toBe(1);

        await store.write({ ...store.current, lastAttemptAt: 0 });
        await run(store, createState(), (s) => s.channel.put(syncSuccess({} as any)));
        expect(store.current).toEqual(expect.objectContaining({ done: true, attempts: 2 }));
    });
});
