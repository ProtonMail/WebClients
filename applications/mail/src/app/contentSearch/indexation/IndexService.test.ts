import 'fake-indexeddb/auto';
import { locks } from 'node:worker_threads';

import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import { readEnabled } from '@proton/encrypted-search/esIDB/configObjectStore';
import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';
import type { ESEvent } from '@proton/encrypted-search/models/interfaces';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import type { ESBaseMessage } from '../../models/encryptedSearch';
import type { LeaderLock } from '../coordination/LeaderLock';
import { TabChannel, type TabMessage } from '../coordination/TabChannel';
import { DatabaseLock as WebLocksDatabaseLock } from '../coordination/weblock/DatabaseLock';
import { openContentSearchDB } from '../db/open';
import type { IndexStatus } from '../db/schema';
import { flush, track } from '../testing/settlement';
import type { Logger } from '../utils/logger';
import {
    type IndexListener,
    IndexService,
    getExistingIndexService,
    getSharedIndexService,
    retainSharedIndexService,
} from './IndexService';
import type { WorkerIndexListener } from './worker/IndexWorker';

const mockCreateWorker = vi.fn();

vi.mock('@proton/encrypted-search/esIDB/configObjectStore', () => {
    return { readEnabled: vi.fn() };
});
vi.mock('@proton/encrypted-search/esIDB/indexedDB', () => {
    return { hasESDB: vi.fn() };
});

vi.mock('comlink', async () => {
    return {
        ...(await vi.importActual('comlink')),
        wrap: () => {
            return async (...args: unknown[]) => {
                return mockCreateWorker(...args);
            };
        },
        proxy: <T>(value: T) => {
            return value;
        },
    };
});

class FakeRawWorker {
    terminate = vi.fn();
}

type WorkerRun = (listener: WorkerIndexListener) => Promise<void>;

/** What a worker was asked to do, in order, with a run that ends as the test decides. */
const fakeWorker = (run: WorkerRun) => {
    const calls: string[] = [];
    const accept = (name: string) => {
        return vi.fn(async () => {
            calls.push(name);
            return true;
        });
    };
    const create = (_userId: string, _indexKey: CryptoKey, _api: unknown, listener: WorkerIndexListener) => {
        return {
            pushStartupAction: accept('startup'),
            pushCatchup: accept('catchup'),
            pushIncrementalUpdate: accept('incremental'),
            start: vi.fn(() => {
                return run(listener);
            }),
            stop: vi.fn(async () => {}),
        };
    };
    return { create, calls };
};

const completesCatchup: WorkerRun = async (listener) => {
    listener.reportTaskStarted('catchup');
    listener.reportTaskCompleted('catchup', true);
};

const failsCatchup: WorkerRun = async (listener) => {
    listener.reportTaskStarted('catchup');
    listener.reportTaskCompleted('catchup', false);
    throw new Error('event request failed');
};

const completesCatchupThenFails: WorkerRun = async (listener) => {
    await completesCatchup(listener);
    listener.reportTaskStarted('incremental');
    listener.reportTaskCompleted('incremental', false);
    throw new Error('body request failed');
};

const appliesLiveUpdate: WorkerRun = async (listener) => {
    listener.reportTaskStarted('incremental');
    listener.reportTaskCompleted('incremental', true);
};

const logger: Logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
};

const liveEvent = (eventID: string): ESEvent<ESBaseMessage> => {
    return {
        Refresh: 0,
        Items: [{ Action: ES_SYNC_ACTIONS.DELETE, ID: 'message-0', ItemMetadata: undefined }],
        attemptReDecryption: false,
        eventsToStore: { [MAIL_EVENTLOOP_NAME]: eventID },
    };
};

/** leadership as the test decides it */
class FakeLeaderLock implements LeaderLock {
    private resolveAcquire: ((acquired: boolean) => void) | undefined;
    private grantNext = false;
    private lostListeners: (() => void)[] = [];

    acquire() {
        if (this.grantNext) {
            this.grantNext = false;
            return Promise.resolve(true);
        }
        return new Promise<boolean>((resolve) => {
            this.resolveAcquire = resolve;
        });
    }

    release() {
        this.resolveAcquire?.(false);
        this.resolveAcquire = undefined;
    }

    onLost(listener: () => void) {
        this.lostListeners.push(listener);
        return () => {
            this.lostListeners = this.lostListeners.filter((l) => {
                return l !== listener;
            });
        };
    }

    /** makes the tab that asks for it, or already did, the leader */
    grant() {
        if (!this.resolveAcquire) {
            this.grantNext = true;
            return;
        }
        this.resolveAcquire(true);
        this.resolveAcquire = undefined;
    }

    /** takes leadership away, as a lease that couldn't be renewed: the tab asks for it again */
    lose() {
        this.lostListeners.forEach((listener) => {
            listener();
        });
    }
}

const makeListener = () => {
    return {
        reportHistoricProgress: vi.fn(),
        reportIndexComplete: vi.fn(),
        reportTaskStarted: vi.fn(),
        reportTaskCompleted: vi.fn(),
        reportError: vi.fn(),
        reportStatusUpdate: vi.fn(),
    } satisfies IndexListener;
};

describe('IndexService', () => {
    let userCounter = 0;
    let service: IndexService;
    let listener: ReturnType<typeof makeListener>;
    let leaderLock: FakeLeaderLock;
    /** another tab of the same user, which sees what this one posts */
    let otherTab: TabChannel;
    let otherTabReceived: TabMessage[];

    /** the run of the worker started last, settles once that worker is done */
    const workerRun = () => {
        return (service as unknown as { indexationPromise?: Promise<void> }).indexationPromise;
    };

    /** enables the index, then delivers one live event per extra worker, waiting for each worker to end */
    const runWorkers = async (...runs: WorkerRun[]) => {
        const workers = runs.map(fakeWorker);
        for (const w of workers) {
            mockCreateWorker.mockImplementationOnce(w.create);
        }
        await service.enable();
        await workerRun();
        for (let i = 1; i < workers.length; i++) {
            await service.handleEvent(liveEvent(`event-${i}`));
            await workerRun();
        }
        return workers.map((w) => {
            return w.calls;
        });
    };

    beforeEach(async () => {
        mockCreateWorker.mockReset();
        (globalThis as any).Worker = FakeRawWorker;
        vi.spyOn(IndexService.prototype as any, 'getKeyAndDropIndexIfNeeded').mockResolvedValue({});
        const userId = `index-service-user-${userCounter++}`;
        leaderLock = new FakeLeaderLock();
        otherTab = new TabChannel(new BroadcastChannel(`content-search:${userId}`));
        otherTabReceived = [];
        otherTab.subscribe((message) => {
            otherTabReceived.push(message);
        });
        service = new IndexService(
            userId,
            vi.fn() as unknown as Api,
            async () => {
                return [];
            },
            vi.fn(),
            logger,
            {
                leaderLock,
                dbLock: new WebLocksDatabaseLock(userId, logger, locks as unknown as LockManager),
                transport: new BroadcastChannel(`content-search:${userId}`),
            },
            '5.0.1.0'
        );
        // initialized, it leads unless a test takes it away
        leaderLock.grant();
        await service.initialize();
        await flush();
        listener = makeListener();
        service.subscribe(listener);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        service.dispose();
        otherTab.close();
    });

    it('has live updates catch up first until a catch-up completed', async () => {
        const calls = await runWorkers(failsCatchup, completesCatchup, appliesLiveUpdate);

        expect(listener.reportError).toHaveBeenCalledTimes(1);
        expect(calls).toEqual([['startup'], ['catchup', 'incremental'], ['incremental']]);
    });

    it('does not catch up for live updates once the startup catch-up completed', async () => {
        const calls = await runWorkers(completesCatchup, appliesLiveUpdate);

        expect(listener.reportError).not.toHaveBeenCalled();
        expect(calls).toEqual([['startup'], ['incremental']]);
    });

    it('catches up again when a worker fails after its catch-up completed, for the live updates it lost', async () => {
        const calls = await runWorkers(completesCatchupThenFails, appliesLiveUpdate);

        expect(listener.reportError).toHaveBeenCalledTimes(1);
        expect(calls).toEqual([['startup'], ['catchup', 'incremental']]);
    });

    it('forwards whether the task succeeded to its listeners', async () => {
        await runWorkers(failsCatchup);

        expect(listener.reportTaskCompleted.mock.calls).toEqual([['catchup', false]]);
    });

    describe('taking part in the election', () => {
        it('asks for leadership only once initialized', async () => {
            const lock = new FakeLeaderLock();
            const acquire = vi.spyOn(lock, 'acquire');
            const other = new IndexService(
                `index-service-user-${userCounter++}`,
                vi.fn() as unknown as Api,
                async () => {
                    return [];
                },
                vi.fn(),
                logger,
                {
                    leaderLock: lock,
                    dbLock: new WebLocksDatabaseLock(service.userId, logger, locks as unknown as LockManager),
                    transport: new BroadcastChannel(`content-search:${service.userId}`),
                },
                '5.0.1.0'
            );

            expect(acquire).not.toHaveBeenCalled();

            await other.initialize();
            await other.initialize();

            expect(acquire).toHaveBeenCalledTimes(1);
            other.dispose();
        });

        it('stops its worker and gives up leadership once disposed', async () => {
            mockCreateWorker.mockImplementationOnce(
                fakeWorker(async () => {
                    await new Promise<void>(() => {});
                }).create
            );
            await service.enable();
            await flush();
            const run = track(workerRun()!);
            const release = vi.spyOn(leaderLock, 'release');

            service.dispose();
            await flush();

            expect(run.state.settled).toBe(true);
            expect(release).toHaveBeenCalled();
            expect(listener.reportError).not.toHaveBeenCalled();
        });
    });

    /** an index left by an earlier session, or by another tab */
    const seedIndex = async ({ status, historicFinished }: { status: IndexStatus; historicFinished: boolean }) => {
        const db = await openContentSearchDB(service.userId);
        const txn = db.transaction(['config', 'anchors'], 'readwrite');
        void txn.objectStore('config').put(status, 'status');
        if (historicFinished) {
            void txn.objectStore('anchors').put({ eof: true }, 'historic');
        }
        await txn.done;
        db.close();
    };

    describe('as a follower', () => {
        beforeEach(() => {
            leaderLock.lose();
        });

        it('reports the stored status and that the index is complete, without a worker', async () => {
            await seedIndex({ status: 'enabled', historicFinished: true });

            await service.initialize();
            await workerRun();

            expect(listener.reportStatusUpdate.mock.calls).toEqual([['enabled']]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
            expect(mockCreateWorker).not.toHaveBeenCalled();
        });

        it('does not report the index complete before the historic pass finished', async () => {
            await seedIndex({ status: 'enabled', historicFinished: false });

            await service.initialize();

            expect(listener.reportStatusUpdate.mock.calls).toEqual([['enabled']]);
            expect(listener.reportIndexComplete).not.toHaveBeenCalled();
        });

        it('does not start the index worker once enabled', async () => {
            await service.enable();
            await workerRun();

            expect(mockCreateWorker).not.toHaveBeenCalled();
            expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith('enabled');
        });

        it('leaves events to the leader', async () => {
            await service.enable();

            await service.handleEvent(liveEvent('event-1'));
            await workerRun();

            expect(mockCreateWorker).not.toHaveBeenCalled();
        });
    });

    describe('taking over leadership', () => {
        beforeEach(() => {
            leaderLock.lose();
        });

        it('runs the leader startup once it becomes the leader', async () => {
            await seedIndex({ status: 'enabled', historicFinished: false });
            await service.initialize();
            const worker = fakeWorker(completesCatchup);
            mockCreateWorker.mockImplementationOnce(worker.create);

            leaderLock.grant();
            await flush();
            await workerRun();

            expect(worker.calls).toEqual(['startup']);
        });

        it('starts no worker when the index is not enabled', async () => {
            await seedIndex({ status: 'paused', historicFinished: false });
            await service.initialize();

            leaderLock.grant();
            await flush();
            await workerRun();

            expect(mockCreateWorker).not.toHaveBeenCalled();
        });
    });

    describe('stepping down', () => {
        /** a worker that indexes until it's stopped */
        const runsUntilStopped: WorkerRun = async () => {
            await new Promise<void>(() => {});
        };

        it('stops its worker the way pausing does', async () => {
            const worker = fakeWorker(runsUntilStopped);
            mockCreateWorker.mockImplementationOnce(worker.create);
            await service.enable();
            await flush();
            const run = track(workerRun()!);

            leaderLock.lose();
            await flush();

            expect(run.state.settled).toBe(true);
            expect(worker.calls).toEqual(['startup']);
            expect(listener.reportError).not.toHaveBeenCalled();
            expect(workerRun()).toBeUndefined();
        });

        it('starts no worker again for the work it had queued, or for events', async () => {
            const worker = fakeWorker(runsUntilStopped);
            mockCreateWorker.mockImplementationOnce(worker.create);
            await service.enable();
            await flush();
            const run = track(workerRun()!);

            leaderLock.lose();
            await service.handleEvent(liveEvent('event-1'));
            await flush();

            expect(run.state.settled).toBe(true);
            expect(mockCreateWorker).toHaveBeenCalledTimes(1);
            expect(workerRun()).toBeUndefined();
        });
    });

    describe('historic progress', () => {
        const indexesTheMailbox: WorkerRun = async (workerListener) => {
            workerListener.reportHistoricProgress(5, 10);
            workerListener.reportIndexComplete();
        };

        it('is posted to the other tabs by the leader', async () => {
            await runWorkers(indexesTheMailbox);
            await flush();

            expect(listener.reportHistoricProgress.mock.calls).toEqual([[5, 10]]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
            expect(
                otherTabReceived.filter((message) => {
                    return message.type === 'progress' || message.type === 'indexComplete';
                })
            ).toEqual([{ type: 'progress', processed: 5, total: 10 }, { type: 'indexComplete' }]);
        });

        it('reaches the listeners of a follower', async () => {
            leaderLock.lose();

            otherTab.post({ type: 'progress', processed: 5, total: 10 });
            otherTab.post({ type: 'indexComplete' });
            await flush();

            expect(listener.reportHistoricProgress.mock.calls).toEqual([[5, 10]]);
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
        });
    });

    describe('status changes', () => {
        const runsUntilStopped: WorkerRun = async () => {
            await new Promise<void>(() => {});
        };

        const statusesPosted = () => {
            return otherTabReceived.filter((message) => {
                return message.type === 'status';
            });
        };

        it.each([true, false])('are posted to the other tabs (leader: %s)', async (isLeader) => {
            if (!isLeader) {
                leaderLock.lose();
            }
            mockCreateWorker.mockImplementation(fakeWorker(completesCatchup).create);

            await service.enable();
            await service.pause();
            await service.enable();
            await service.disable();
            await flush();

            expect(statusesPosted()).toEqual([
                { type: 'status', status: 'enabled' },
                { type: 'status', status: 'paused' },
                { type: 'status', status: 'enabled' },
                { type: 'status', status: 'disabled' },
            ]);
        });

        it('has the leader start its worker when another tab enables the index', async () => {
            const worker = fakeWorker(completesCatchup);
            mockCreateWorker.mockImplementationOnce(worker.create);
            await service.initialize();

            await seedIndex({ status: 'enabled', historicFinished: false });
            otherTab.post({ type: 'status', status: 'enabled' });
            await flush();
            await workerRun();

            expect(service.isEnabled).toBe(true);
            expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith('enabled');
            expect(worker.calls).toEqual(['startup']);
        });

        it('has a follower report it when another tab enables the index, without a worker', async () => {
            leaderLock.lose();
            await service.initialize();

            await seedIndex({ status: 'enabled', historicFinished: true });
            otherTab.post({ type: 'status', status: 'enabled' });
            await flush();

            expect(service.isEnabled).toBe(true);
            expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith('enabled');
            expect(listener.reportIndexComplete).toHaveBeenCalledTimes(1);
            expect(mockCreateWorker).not.toHaveBeenCalled();
        });

        it.each(['paused', 'disabled'] as const)(
            'has the leader stop its worker when another tab sets the index %s',
            async (status) => {
                mockCreateWorker.mockImplementationOnce(fakeWorker(runsUntilStopped).create);
                await service.enable();
                await flush();
                const run = track(workerRun()!);

                await seedIndex({ status, historicFinished: false });
                otherTab.post({ type: 'status', status });
                await flush();

                expect(run.state.settled).toBe(true);
                expect(service.isEnabled).toBe(false);
                expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith(status);
                expect(listener.reportError).not.toHaveBeenCalled();
            }
        );

        it('leaves a service that was never initialized out of the election when another tab enables the index', async () => {
            const lock = new FakeLeaderLock();
            const acquire = vi.spyOn(lock, 'acquire');
            const uninitialized = new IndexService(
                service.userId,
                vi.fn() as unknown as Api,
                async () => {
                    return [];
                },
                vi.fn(),
                logger,
                {
                    leaderLock: lock,
                    dbLock: new WebLocksDatabaseLock(service.userId, logger, locks as unknown as LockManager),
                    transport: new BroadcastChannel(`content-search:${service.userId}`),
                },
                '5.0.1.0'
            );

            await seedIndex({ status: 'enabled', historicFinished: false });
            otherTab.post({ type: 'status', status: 'enabled' });
            await flush();

            expect(acquire).not.toHaveBeenCalled();
            uninitialized.dispose();
        });

        it('has a follower report it when another tab pauses the index', async () => {
            leaderLock.lose();
            await service.enable();

            otherTab.post({ type: 'status', status: 'paused' });
            await flush();

            expect(service.isEnabled).toBe(false);
            expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith('paused');
        });
    });

    /** a worker that indexes until its database connection is closed under it, then fails as a real one does */
    const failsWhenItsConnectionCloses: WorkerRun = async () => {
        await new Promise<void>((_, reject) => {
            void openContentSearchDB(service.userId, () => {
                reject(new Error("Can't start a transaction on a closed database"));
            });
        });
    };

    /** another tab, which never leads */
    const openFollower = () => {
        const follower = new IndexService(
            service.userId,
            vi.fn() as unknown as Api,
            async () => {
                return [];
            },
            vi.fn(),
            logger,
            {
                leaderLock: new FakeLeaderLock(),
                dbLock: new WebLocksDatabaseLock(service.userId, logger, locks as unknown as LockManager),
                transport: new BroadcastChannel(`content-search:${service.userId}`),
            },
            '5.0.1.0'
        );
        return {
            follower,
            close: () => {
                follower.dispose();
            },
        };
    };

    const readStoredStatus = async () => {
        const db = await openContentSearchDB(service.userId);
        try {
            return await db.get('config', 'status');
        } finally {
            db.close();
        }
    };

    describe('clearing data', () => {
        it('reports the index deleted to its own listeners', async () => {
            mockCreateWorker.mockImplementation(fakeWorker(completesCatchup).create);
            await service.enable();
            await workerRun();

            await service.deleteIndex();
            await flush();

            expect(service.isEnabled).toBe(false);
            expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith(undefined);
            expect(await readStoredStatus()).toBeUndefined();
        });
    });

    describe('clearing data in a follower', () => {
        it('reports the index deleted in the follower too', async () => {
            mockCreateWorker.mockImplementation(fakeWorker(failsWhenItsConnectionCloses).create);
            await service.enable();
            await flush();
            const { follower, close } = openFollower();
            await follower.initialize();
            const followerListener = makeListener();
            follower.subscribe(followerListener);

            await follower.deleteIndex();
            await flush(20);

            expect(followerListener.reportStatusUpdate).toHaveBeenLastCalledWith(undefined);
            close();
        });

        it('deletes the database, and the leader stops indexing for good', async () => {
            mockCreateWorker.mockImplementation(fakeWorker(failsWhenItsConnectionCloses).create);
            await service.enable();
            await flush();
            const { follower, close } = openFollower();
            await follower.initialize();

            const deletion = track(follower.deleteIndex());
            await flush(20);

            expect(deletion.state.settled).toBe(true);
            expect(deletion.state.rejected).toBe(false);
            expect(service.isEnabled).toBe(false);
            expect(listener.reportStatusUpdate).toHaveBeenLastCalledWith(undefined);

            await service.handleEvent(liveEvent('event-1'));
            await flush();

            expect(mockCreateWorker).toHaveBeenCalledTimes(1);
            expect(await readStoredStatus()).toBeUndefined();
            close();
        });
    });

    describe('a flag-switch reset in another tab while the leader indexes', () => {
        it('leaves the index alone when the other tab is on the indexation path too', async () => {
            const worker = fakeWorker(failsWhenItsConnectionCloses);
            mockCreateWorker.mockImplementation(worker.create);
            await service.enable();
            await flush();
            const run = track(workerRun()!);
            const { follower, close } = openFollower();

            follower.resetDbBetweenFeatureFlagSwitches(true);
            await follower.waitForDbReset();
            await flush();

            expect(run.state.settled).toBe(false);
            expect(service.isEnabled).toBe(true);
            expect(await readStoredStatus()).toBe('enabled');
            close();
        });

        it('stops the leader for good when the other tab is on the import path', async () => {
            mockCreateWorker.mockImplementation(fakeWorker(failsWhenItsConnectionCloses).create);
            await service.enable();
            await flush();
            const { follower, close } = openFollower();

            follower.resetDbBetweenFeatureFlagSwitches(false);
            const reset = track(follower.waitForDbReset());
            await flush(20);

            expect(reset.state.settled).toBe(true);
            expect(reset.state.rejected).toBe(false);
            expect(service.isEnabled).toBe(false);

            await service.handleEvent(liveEvent('event-1'));
            await flush();

            expect(mockCreateWorker).toHaveBeenCalledTimes(1);
            expect(await readStoredStatus()).toBeUndefined();
            close();
        });
    });

    describe('switching ContentSearchIndexation', () => {
        const seedConfig = async (entries: { indexKey?: string; status?: 'enabled' }) => {
            const db = await openContentSearchDB(service.userId);
            const txn = db.transaction(['config', 'index_blobs'], 'readwrite');
            if (entries.indexKey) {
                void txn.objectStore('config').put(entries.indexKey, 'indexKey');
            }
            if (entries.status) {
                void txn.objectStore('config').put(entries.status, 'status');
            }
            void txn.objectStore('index_blobs').put(new Uint8Array([1]), 'blob-0');
            await txn.done;
            db.close();
        };

        const readStatusAndBlobs = async () => {
            const db = await openContentSearchDB(service.userId);
            try {
                return { status: await db.get('config', 'status'), blobs: await db.count('index_blobs') };
            } finally {
                db.close();
            }
        };

        const readOutdated = async () => {
            const db = await openContentSearchDB(service.userId);
            try {
                return await db.get('outdated_import_ids', 'message-0');
            } finally {
                db.close();
            }
        };

        it('rebuilds an imported index from scratch on the indexation path when v1 search is enabled', async () => {
            vi.mocked(hasESDB).mockResolvedValue(true);
            vi.mocked(readEnabled).mockResolvedValue(true);
            await seedConfig({ indexKey: 'imported-key' });
            const worker = fakeWorker(completesCatchup);
            mockCreateWorker.mockImplementationOnce(worker.create);

            service.resetDbBetweenFeatureFlagSwitches(true);
            await service.initialize();
            await workerRun();

            expect(listener.reportStatusUpdate.mock.calls).toEqual([['enabled']]);
            expect(worker.calls).toEqual(['startup']);
            expect(await readStatusAndBlobs()).toEqual({ status: 'enabled', blobs: 0 });
        });

        it('drops the index built by the indexer on the import path before importing', async () => {
            vi.mocked(hasESDB).mockResolvedValue(false);
            await seedConfig({ indexKey: 'indexer-key', status: 'enabled' });

            service.resetDbBetweenFeatureFlagSwitches(false);
            await service.importFromEncryptedSearch();

            expect(await readStatusAndBlobs()).toEqual({ status: undefined, blobs: 0 });
        });

        it('records changes into the new database once the index built by the indexer is dropped', async () => {
            await seedConfig({ indexKey: 'indexer-key', status: 'enabled' });

            service.resetDbBetweenFeatureFlagSwitches(false);
            await service.recordOutdatedMessages(liveEvent('event-0'));

            expect(await readStatusAndBlobs()).toEqual({ status: undefined, blobs: 0 });
            expect(await readOutdated()).toEqual({ deleted: true });
        });

        it('does not let the reset recreate the database when it is deleted during the reset', async () => {
            vi.mocked(hasESDB).mockResolvedValue(true);
            vi.mocked(readEnabled).mockResolvedValue(true);
            await seedConfig({ indexKey: 'imported-key' });

            service.resetDbBetweenFeatureFlagSwitches(true);
            await service.deleteIndex();
            await service.waitForDbReset();

            expect(await readStatusAndBlobs()).toEqual({ status: undefined, blobs: 0 });
        });

        it('still deletes the database when the reset failed', async () => {
            vi.mocked(hasESDB).mockRejectedValue(new Error('v1 unavailable'));
            await seedConfig({ indexKey: 'imported-key' });

            service.resetDbBetweenFeatureFlagSwitches(true);
            await service.deleteIndex();

            expect(await readStatusAndBlobs()).toEqual({ status: undefined, blobs: 0 });
        });
    });
});

describe('the shared IndexService', () => {
    let userCounter = 0;

    const getShared = (userId: string) => {
        return getSharedIndexService(
            userId,
            '5.0.1.0',
            vi.fn() as unknown as Api,
            async () => {
                return [];
            },
            vi.fn(),
            logger
        );
    };

    it('is disposed and forgotten once the last component using it releases it', async () => {
        const userId = `shared-index-service-${userCounter++}`;
        const first = getShared(userId);
        const dispose = vi.spyOn(first, 'dispose');
        const release = retainSharedIndexService();

        release();
        await flush();

        expect(dispose).toHaveBeenCalledTimes(1);
        expect(getExistingIndexService(userId)).toBeUndefined();
        const second = getShared(userId);
        expect(second).not.toBe(first);
        retainSharedIndexService()();
        await flush();
    });

    it('survives a remount, which releases it and retains it again in the same commit', async () => {
        const userId = `shared-index-service-${userCounter++}`;
        const shared = getShared(userId);
        const dispose = vi.spyOn(shared, 'dispose');
        const release = retainSharedIndexService();

        // the new component rendered with the same instance, then the old one unmounts and the new one mounts
        release();
        const releaseAgain = retainSharedIndexService();
        await flush();

        expect(dispose).not.toHaveBeenCalled();
        expect(getShared(userId)).toBe(shared);
        releaseAgain();
        await flush();
    });
});
