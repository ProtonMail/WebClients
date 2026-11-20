// Cross-tab behavior of the Web Locks DatabaseLock: two instances on Node's lock manager stand for two tabs of one
// origin. The in-tab behavior is covered by the DatabaseLock contract tests.
import { locks } from 'node:worker_threads';

import { silentLogger } from '../../testing/logger';
import { deferred, flush, track } from '../../testing/settlement';
import { DatabaseLock } from './DatabaseLock';

const lockManager = locks as unknown as LockManager;

let userCounter = 0;

/** two tabs of one user, sharing the locks as tabs of one origin do */
const openTabs = (count: number) => {
    const userId = `web-locks-database-lock-${userCounter++}`;
    const tabs = Array.from({ length: count }, () => {
        return new DatabaseLock(userId, silentLogger, lockManager);
    });
    return { userId, tabs };
};

/** releases every lock of the user while its callbacks never settle, as a tab that is closed or crashes does */
const closeTabAbruptly = async (userId: string) => {
    for (const name of ['interrupt', 'access']) {
        await lockManager.request(`content-search:${userId}:${name}`, { steal: true }, async () => {});
    }
};

/** indexing that counts its runs, and waits for `unwind` once aborted before throwing the abort */
const countingIndexing = (unwind?: Promise<void>) => {
    const counter = { runs: 0, signals: [] as AbortSignal[], started: deferred() };
    const callback = async (signal: AbortSignal) => {
        counter.runs++;
        counter.signals.push(signal);
        counter.started.resolve();
        await new Promise<void>((_, reject) => {
            signal.addEventListener('abort', () => {
                void (unwind ?? Promise.resolve()).then(() => {
                    reject(signal.reason);
                });
            });
        });
    };
    return { counter, callback };
};

/** a search that runs until `finish` is resolved */
const pendingSearch = () => {
    const finish = deferred();
    const state = { started: false };
    const callback = async () => {
        state.started = true;
        await finish.promise;
    };
    return { finish, state, callback };
};

describe('Web Locks DatabaseLock across tabs', () => {
    it('aborts indexing in another tab, and searches only once that indexing has unwound', async () => {
        const {
            tabs: [tab1, tab2],
        } = openTabs(2);
        const unwind = deferred();
        const indexing = countingIndexing(unwind.promise);
        track(tab1.runIndexing(indexing.callback));
        await indexing.counter.started.promise;

        const search = pendingSearch();
        track(tab2.runSearch(search.callback));
        await flush();

        expect(indexing.counter.signals[0].aborted).toBe(true);
        expect(search.state.started).toBe(false);

        unwind.resolve();
        await flush();

        expect(search.state.started).toBe(true);
    });

    it('resumes indexing only once the search in the other tab is done', async () => {
        const {
            tabs: [tab1, tab2],
        } = openTabs(2);
        const indexing = countingIndexing();
        const indexingRun = track(tab1.runIndexing(indexing.callback));
        await indexing.counter.started.promise;

        const search = pendingSearch();
        const searchRun = track(tab2.runSearch(search.callback));
        await flush();

        expect(search.state.started).toBe(true);
        expect(indexing.counter.runs).toBe(1);

        search.finish.resolve();
        await flush();

        expect(searchRun.state.settled).toBe(true);
        expect(indexing.counter.runs).toBe(2);
        expect(indexing.counter.signals[1].aborted).toBe(false);
        expect(indexingRun.state.settled).toBe(false);
    });

    it('does not run indexing that is interrupted while it still waits for the access lock', async () => {
        const {
            tabs: [tab1, tab2, tab3],
        } = openTabs(3);
        const longSearch = pendingSearch();
        track(tab2.runSearch(longSearch.callback));
        await flush();

        const indexing = countingIndexing();
        track(tab1.runIndexing(indexing.callback));
        // a search in a third tab takes the interrupt lock from the long search, and is done before it
        await tab3.runSearch(async () => {});
        await flush();
        // indexing now holds the interrupt lock and waits for the long search to release the access lock
        expect(indexing.counter.runs).toBe(0);

        const interruptingSearch = pendingSearch();
        track(tab3.runSearch(interruptingSearch.callback));
        await flush();
        // Browsers drop an aborted request from the queue, so the search would already run here. Node keeps it
        // queued (rejected, but listed as pending until its turn), so the search waits for the long one.
        longSearch.finish.resolve();
        await flush();

        expect(interruptingSearch.state.started).toBe(true);
        expect(indexing.counter.runs).toBe(0);

        interruptingSearch.finish.resolve();
        await flush();

        expect(indexing.counter.runs).toBe(1);
    });

    it('resumes indexing once, after the last of back-to-back searches in other tabs', async () => {
        const {
            tabs: [tab1, tab2, tab3],
        } = openTabs(3);
        const indexing = countingIndexing();
        track(tab1.runIndexing(indexing.callback));
        await indexing.counter.started.promise;

        const first = pendingSearch();
        const second = pendingSearch();
        track(tab2.runSearch(first.callback));
        await flush();
        track(tab3.runSearch(second.callback));
        await flush();

        expect(first.state.started).toBe(true);
        expect(second.state.started).toBe(true);

        first.finish.resolve();
        await flush();

        expect(indexing.counter.runs).toBe(1);

        second.finish.resolve();
        await flush();

        expect(indexing.counter.runs).toBe(2);
    });

    it('logs that indexing was interrupted and when it resumes', async () => {
        const userId = `web-locks-database-lock-${userCounter++}`;
        const info = vi.fn();
        const tab1 = new DatabaseLock(userId, { ...silentLogger, info }, lockManager);
        const tab2 = new DatabaseLock(userId, silentLogger, lockManager);
        const indexing = countingIndexing();
        track(tab1.runIndexing(indexing.callback));
        await indexing.counter.started.promise;

        const search = pendingSearch();
        track(tab2.runSearch(search.callback));
        await flush();

        expect(info.mock.calls).toEqual([['indexing interrupted by a search, in this tab or another']]);

        search.finish.resolve();
        await flush();

        expect(info.mock.calls).toEqual([
            ['indexing interrupted by a search, in this tab or another'],
            ['indexing resumes, the searches that interrupted it are done'],
        ]);
    });

    describe('a tab that goes away', () => {
        it('does not keep a search in another tab waiting while it was indexing', async () => {
            const {
                userId,
                tabs: [tab1, tab2],
            } = openTabs(2);
            const neverUnwinds = deferred();
            const indexing = countingIndexing(neverUnwinds.promise);
            track(tab1.runIndexing(indexing.callback));
            await indexing.counter.started.promise;

            const search = pendingSearch();
            const searchRun = track(tab2.runSearch(search.callback));
            await flush();

            expect(search.state.started).toBe(false);

            await closeTabAbruptly(userId);
            await flush();

            expect(search.state.started).toBe(true);
            search.finish.resolve();
            await flush();
            expect(searchRun.state.settled).toBe(true);
        });

        it('does not keep indexing in another tab paused while it was searching', async () => {
            const {
                userId,
                tabs: [tab1, tab2],
            } = openTabs(2);
            const indexing = countingIndexing();
            track(tab1.runIndexing(indexing.callback));
            await indexing.counter.started.promise;

            const neverFinishes = pendingSearch();
            track(tab2.runSearch(neverFinishes.callback));
            await flush();

            expect(indexing.counter.runs).toBe(1);

            await closeTabAbruptly(userId);
            await flush();

            expect(indexing.counter.runs).toBe(2);
        });
    });
});
