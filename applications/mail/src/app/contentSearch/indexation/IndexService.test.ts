import 'fake-indexeddb/auto';
import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import { readEnabled } from '@proton/encrypted-search/esIDB/configObjectStore';
import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';
import type { ESEvent } from '@proton/encrypted-search/models/interfaces';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import type { ESBaseMessage } from '../../models/encryptedSearch';
import { openContentSearchDB } from '../db/open';
import type { Logger } from '../utils/logger';
import { type IndexListener, IndexService } from './IndexService';
import type { WorkerIndexListener } from './worker/IndexWorker';

const mockCreateWorker = jest.fn();

jest.mock('@proton/encrypted-search/esIDB/configObjectStore', () => {
    return { readEnabled: jest.fn() };
});
jest.mock('@proton/encrypted-search/esIDB/indexedDB', () => {
    return { hasESDB: jest.fn() };
});

jest.mock('comlink', () => {
    return {
        ...jest.requireActual('comlink'),
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
    terminate = jest.fn();
}

type WorkerRun = (listener: WorkerIndexListener) => Promise<void>;

/** What a worker was asked to do, in order, with a run that ends as the test decides. */
const fakeWorker = (run: WorkerRun) => {
    const calls: string[] = [];
    const accept = (name: string) => {
        return jest.fn(async () => {
            calls.push(name);
            return true;
        });
    };
    const create = (_userId: string, _indexKey: CryptoKey, _api: unknown, listener: WorkerIndexListener) => {
        return {
            pushStartupAction: accept('startup'),
            pushCatchup: accept('catchup'),
            pushIncrementalUpdate: accept('incremental'),
            start: jest.fn(() => {
                return run(listener);
            }),
            stop: jest.fn(async () => {}),
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
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
};

const liveEvent = (eventID: string): ESEvent<ESBaseMessage> => {
    return {
        Refresh: 0,
        Items: [{ Action: ES_SYNC_ACTIONS.DELETE, ID: 'message-0', ItemMetadata: undefined }],
        attemptReDecryption: false,
        eventsToStore: { [MAIL_EVENTLOOP_NAME]: eventID },
    };
};

const makeListener = () => {
    return {
        reportHistoricProgress: jest.fn(),
        reportIndexComplete: jest.fn(),
        reportTaskStarted: jest.fn(),
        reportTaskCompleted: jest.fn(),
        reportError: jest.fn(),
        reportStatusUpdate: jest.fn(),
    } satisfies IndexListener;
};

describe('IndexService', () => {
    let userCounter = 0;
    let service: IndexService;
    let listener: ReturnType<typeof makeListener>;

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

    beforeEach(() => {
        mockCreateWorker.mockReset();
        (globalThis as any).Worker = FakeRawWorker;
        jest.spyOn(IndexService.prototype as any, 'getKeyAndDropIndexIfNeeded').mockResolvedValue({});
        service = new IndexService(
            `index-service-user-${userCounter++}`,
            jest.fn() as unknown as Api,
            async () => {
                return [];
            },
            jest.fn(),
            logger
        );
        listener = makeListener();
        service.subscribe(listener);
    });

    afterEach(() => {
        jest.restoreAllMocks();
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
            jest.mocked(hasESDB).mockResolvedValue(true);
            jest.mocked(readEnabled).mockResolvedValue(true);
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
            jest.mocked(hasESDB).mockResolvedValue(false);
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
            jest.mocked(hasESDB).mockResolvedValue(true);
            jest.mocked(readEnabled).mockResolvedValue(true);
            await seedConfig({ indexKey: 'imported-key' });

            service.resetDbBetweenFeatureFlagSwitches(true);
            await service.deleteIndex();
            await service.waitForDbReset();

            expect(await readStatusAndBlobs()).toEqual({ status: undefined, blobs: 0 });
        });

        it('still deletes the database when the reset failed', async () => {
            jest.mocked(hasESDB).mockRejectedValue(new Error('v1 unavailable'));
            await seedConfig({ indexKey: 'imported-key' });

            service.resetDbBetweenFeatureFlagSwitches(true);
            await service.deleteIndex();

            expect(await readStatusAndBlobs()).toEqual({ status: undefined, blobs: 0 });
        });
    });
});
