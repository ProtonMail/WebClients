// DatabaseLock arbitrates exclusive DB access between indexing (long-running, abortable) and
// search (short, must not wait for a full index run). These tests drive both sides by hand and
// never block on a promise that may not settle: everything is asserted through a settlement
// tracker after flushing the event loop, so a lock-up shows up as a failed expectation
// rather than a hanging test.
import { DatabaseLock } from './DatabaseLock';

const deferred = <T = void>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

/** what an aborted idb/worker operation throws, and what runIndexing keys off of */
const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

/** let pending microtasks _and_ timers run, so anything that can settle has settled */
const flush = async (turns = 5) => {
    for (let i = 0; i < turns; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

/** observe a promise without awaiting it, so a promise that never settles fails an assertion instead of hanging the test */
const track = <T>(promise: Promise<T>) => {
    const state = { settled: false, rejected: false, error: undefined as unknown };
    const tracked = promise.then(
        (value) => {
            state.settled = true;
            return value;
        },
        (error) => {
            state.settled = true;
            state.rejected = true;
            state.error = error;
        }
    );
    return { state, done: tracked };
};

/** indexing callback that hangs until aborted, then reports the abort the way a real worker would */
const abortableIndexing = (onStart?: () => void) => async (signal: AbortSignal) => {
    onStart?.();
    await new Promise<void>((_, reject) => {
        signal.addEventListener('abort', () => reject(abortError()));
    });
};

describe('DatabaseLock', () => {
    describe('with nothing else running', () => {
        it('runs indexing once with a live signal', async () => {
            const lock = new DatabaseLock();
            const signals: AbortSignal[] = [];

            await lock.runIndexing(async (signal) => {
                signals.push(signal);
            });

            expect(signals).toHaveLength(1);
            expect(signals[0].aborted).toBe(false);
        });

        it('runs search immediately when no indexing has ever started', async () => {
            const lock = new DatabaseLock();
            let ran = false;

            const search = track(
                lock.runSearch(async () => {
                    ran = true;
                })
            );
            await flush();

            expect(ran).toBe(true);
            expect(search.state.settled).toBe(true);
        });

        it('runs search immediately once a previous indexing run has completed', async () => {
            const lock = new DatabaseLock();
            await lock.runIndexing(async () => {});
            let ran = false;

            const search = track(
                lock.runSearch(async () => {
                    ran = true;
                })
            );
            await flush();

            expect(ran).toBe(true);
            expect(search.state.settled).toBe(true);
        });
    });

    describe('search interrupting indexing', () => {
        it('aborts the in-flight indexing run and lets the search through', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            let runs = 0;
            const signals: AbortSignal[] = [];
            const indexing = track(
                lock.runIndexing(async (signal) => {
                    runs++;
                    signals.push(signal);
                    if (runs === 1) {
                        started.resolve();
                        await abortableIndexing()(signal);
                    }
                })
            );
            await started.promise;

            let searched = false;
            const search = track(
                lock.runSearch(async () => {
                    searched = true;
                })
            );
            await flush();

            expect(signals[0].aborted).toBe(true);
            expect(searched).toBe(true);
            expect(search.state.settled).toBe(true);
            // and indexing restarts afterwards, with a fresh signal, until it can complete
            expect(runs).toBe(2);
            expect(signals[1].aborted).toBe(false);
            expect(indexing.state.settled).toBe(true);
        });

        it('waits for indexing to acknowledge the abort before touching the db', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            const letIndexingFinishAborting = deferred();
            let runs = 0;
            const indexing = track(
                lock.runIndexing(async () => {
                    runs++;
                    if (runs === 1) {
                        started.resolve();
                        // an indexing run that is mid-transaction when the abort arrives:
                        // it only throws once it has wound down
                        await letIndexingFinishAborting.promise;
                        throw abortError();
                    }
                })
            );
            await started.promise;

            let searched = false;
            const search = track(
                lock.runSearch(async () => {
                    searched = true;
                })
            );
            await flush();

            // the abort has been requested, but indexing hasn't confirmed it yet
            expect(searched).toBe(false);
            expect(search.state.settled).toBe(false);

            letIndexingFinishAborting.resolve();
            await flush();

            expect(searched).toBe(true);
            expect(search.state.settled).toBe(true);
            expect(indexing.state.settled).toBe(true);
        });

        it('keeps indexing paused until the search callback is done', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            const finishSearch = deferred();
            let runs = 0;
            track(
                lock.runIndexing(async (signal) => {
                    runs++;
                    await abortableIndexing(runs === 1 ? started.resolve : undefined)(signal);
                })
            );
            await started.promise;

            track(lock.runSearch(() => finishSearch.promise));
            await flush();

            expect(runs).toBe(1);

            finishSearch.resolve();
            await flush();

            expect(runs).toBe(2);
        });

        it('lets the search through when the aborted indexing run completes instead of throwing', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            const finishIndexing = deferred();
            let runs = 0;
            const indexing = track(
                lock.runIndexing(async () => {
                    runs++;
                    started.resolve();
                    // races the abort against its own completion (as ImportHandle does), and this
                    // time completion wins: the run ends normally despite the abort being requested
                    await finishIndexing.promise;
                })
            );
            await started.promise;

            let searched = false;
            const search = track(
                lock.runSearch(async () => {
                    searched = true;
                })
            );
            await flush();

            expect(searched).toBe(false);

            finishIndexing.resolve();
            await flush();

            // indexing is done with the db, so the search must not be left waiting for an
            // acknowledgement that will never come
            expect(indexing.state.settled).toBe(true);
            expect(searched).toBe(true);
            expect(search.state.settled).toBe(true);
            expect(runs).toBe(1);
        });

        it('serializes back-to-back searches and only resumes indexing after the last one', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            const finishFirstSearch = deferred();
            const finishSecondSearch = deferred();
            let runs = 0;
            let secondSearchStarted = false;
            track(
                lock.runIndexing(async (signal) => {
                    runs++;
                    await abortableIndexing(runs === 1 ? started.resolve : undefined)(signal);
                })
            );
            await started.promise;

            const first = track(lock.runSearch(() => finishFirstSearch.promise));
            await flush();
            // a second search is requested while the first is still running
            const second = track(
                lock.runSearch(async () => {
                    secondSearchStarted = true;
                    await finishSecondSearch.promise;
                })
            );
            await flush();

            // it waits its turn rather than hitting the db alongside the first
            expect(secondSearchStarted).toBe(false);
            expect(runs).toBe(1);

            finishFirstSearch.resolve();
            await flush();

            expect(first.state.settled).toBe(true);
            expect(secondSearchStarted).toBe(true);
            expect(second.state.settled).toBe(false);
            // indexing stays paused while the second search holds the lock
            expect(runs).toBe(1);

            finishSecondSearch.resolve();
            await flush();

            expect(second.state.settled).toBe(true);
            expect(runs).toBe(2);
        });
    });

    describe('serializing searches', () => {
        it('runs overlapping searches one after the other', async () => {
            const lock = new DatabaseLock();
            const finishFirst = deferred();
            const order: string[] = [];

            const first = track(
                lock.runSearch(async () => {
                    order.push('first:start');
                    await finishFirst.promise;
                    order.push('first:end');
                })
            );
            const second = track(
                lock.runSearch(async () => {
                    order.push('second:start');
                })
            );
            await flush();

            expect(order).toEqual(['first:start']);

            finishFirst.resolve();
            await flush();

            expect(order).toEqual(['first:start', 'first:end', 'second:start']);
            expect(first.state.settled).toBe(true);
            expect(second.state.settled).toBe(true);
        });

        it('still runs a queued search after the one before it throws', async () => {
            const lock = new DatabaseLock();
            const finishFirst = deferred();
            let secondRan = false;

            const first = track(lock.runSearch(() => finishFirst.promise));
            const second = track(
                lock.runSearch(async () => {
                    secondRan = true;
                })
            );
            await flush();

            expect(secondRan).toBe(false);

            finishFirst.reject(new Error('search boom'));
            await flush();

            expect(first.state.rejected).toBe(true);
            expect((first.state.error as Error).message).toBe('search boom');
            expect(secondRan).toBe(true);
            expect(second.state.settled).toBe(true);
            expect(second.state.rejected).toBe(false);
        });
    });

    describe('error handling', () => {
        it('propagates a non-abort indexing failure without retrying', async () => {
            const lock = new DatabaseLock();
            let runs = 0;

            await expect(
                lock.runIndexing(async () => {
                    runs++;
                    throw new Error('boom');
                })
            ).rejects.toThrow('boom');

            expect(runs).toBe(1);
        });

        it('releases a waiting search when indexing fails outright', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            const failIndexing = deferred();
            const indexing = track(
                lock.runIndexing(async () => {
                    started.resolve();
                    await failIndexing.promise;
                })
            );
            await started.promise;

            let searched = false;
            const search = track(
                lock.runSearch(async () => {
                    searched = true;
                })
            );
            await flush();
            expect(searched).toBe(false);

            // indexing dies on a real error rather than acknowledging the abort
            failIndexing.reject(new Error('boom'));
            await flush();

            expect(indexing.state.rejected).toBe(true);
            expect(searched).toBe(true);
            expect(search.state.settled).toBe(true);
        });

        it('releases the lock when the search callback throws', async () => {
            const lock = new DatabaseLock();
            const started = deferred();
            let runs = 0;
            const indexing = track(
                lock.runIndexing(async (signal) => {
                    runs++;
                    if (runs === 1) {
                        await abortableIndexing(started.resolve)(signal);
                    }
                })
            );
            await started.promise;

            const search = track(
                lock.runSearch(async () => {
                    throw new Error('search boom');
                })
            );
            await flush();

            expect(search.state.rejected).toBe(true);
            expect((search.state.error as Error).message).toBe('search boom');
            // a failed search must not wedge indexing: it resumes and completes
            expect(runs).toBe(2);
            expect(indexing.state.settled).toBe(true);
        });
    });
});
