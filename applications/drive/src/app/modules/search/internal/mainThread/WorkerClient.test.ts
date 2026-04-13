// Import after mocks are set up.
import { SearchWorkerDisconnectedError } from '../shared/errors';
import type { ClientId, UserId } from '../shared/types';
import type { MainThreadBridge } from './MainThreadBridge';
import { WorkerClient } from './WorkerClient';

const fakeApi = {
    registerClient: jest.fn(),
    heartbeatClient: jest.fn(),
    disconnectClient: jest.fn(),
    queryIndexerState: jest.fn(),
    search: jest.fn(),
    reset: jest.fn(),
};

jest.mock('comlink', () => ({
    wrap: () => fakeApi,
    proxy: (x: unknown) => x,
}));

jest.mock('../shared/Logger', () => ({
    Logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), listenForWorkerLogs: jest.fn() },
}));

// Stub SharedWorker with an accessor for the name passed at construction.
let createdWorkers: { name: string | undefined }[] = [];
(globalThis as any).SharedWorker = class {
    port = {};
    constructor(_url: URL, options?: { name?: string }) {
        createdWorkers.push({ name: options?.name });
    }
};

const USER_ID = 'user-1' as UserId;
const CLIENT_ID = 'client-1' as ClientId;
const BRIDGE = {} as MainThreadBridge;

describe('WorkerClient', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        createdWorkers = [];
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('does not call registerClient on construction', () => {
        new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
        expect(fakeApi.registerClient).not.toHaveBeenCalled();
    });

    it('calls registerClient on first start()', () => {
        const client = new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
        client.start();
        expect(fakeApi.registerClient).toHaveBeenCalledTimes(1);
    });

    it('calling start() multiple times only registers once', () => {
        const client = new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
        client.start();
        client.start();
        client.start();
        expect(fakeApi.registerClient).toHaveBeenCalledTimes(1);
    });

    it('creates a SharedWorker with a name scoped to userId and appVersion', () => {
        new WorkerClient('user-a' as UserId, '2.0.0', CLIENT_ID, BRIDGE);
        new WorkerClient('user-b' as UserId, '2.0.0', CLIENT_ID, BRIDGE);
        new WorkerClient('user-a' as UserId, '3.0.0', CLIENT_ID, BRIDGE);

        expect(createdWorkers[0].name).toBe('drive-search-worker/2.0.0/user-a');
        expect(createdWorkers[1].name).toBe('drive-search-worker/2.0.0/user-b');
        expect(createdWorkers[2].name).toBe('drive-search-worker/3.0.0/user-a');

        // All three are distinct
        const names = createdWorkers.map((w) => w.name);
        expect(new Set(names).size).toBe(3);
    });

    describe('reverse heartbeat', () => {
        it('sends heartbeat every 3 seconds', () => {
            new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);

            expect(fakeApi.heartbeatClient).not.toHaveBeenCalled();

            jest.advanceTimersByTime(3000);
            expect(fakeApi.heartbeatClient).toHaveBeenCalledTimes(1);
            expect(fakeApi.heartbeatClient).toHaveBeenCalledWith(CLIENT_ID);

            jest.advanceTimersByTime(3000);
            expect(fakeApi.heartbeatClient).toHaveBeenCalledTimes(2);
        });

        it('reconnects when heartbeat times out', async () => {
            fakeApi.heartbeatClient.mockReturnValue(new Promise(() => {})); // never resolves

            const client = new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
            client.start();
            jest.clearAllMocks();
            createdWorkers = [];

            // Trigger heartbeat + timeout in one step
            await jest.advanceTimersByTimeAsync(3000 + 5000);

            // Reconnect spawns a new SharedWorker after a jitter delay (0–1s)
            await jest.advanceTimersByTimeAsync(1000);
            expect(createdWorkers).toHaveLength(1);

            // Re-registers because it was running
            expect(fakeApi.registerClient).toHaveBeenCalledTimes(1);
        });

        it('does not re-register on reconnect if not started', async () => {
            fakeApi.heartbeatClient.mockReturnValue(new Promise(() => {}));

            new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
            jest.clearAllMocks();
            createdWorkers = [];

            // Trigger heartbeat + timeout
            await jest.advanceTimersByTimeAsync(3000 + 5000);

            // Reconnect after jitter
            await jest.advanceTimersByTimeAsync(1000);
            expect(createdWorkers).toHaveLength(1);
            expect(fakeApi.registerClient).not.toHaveBeenCalled();
        });

        it('cancels in-flight searches on reconnect', async () => {
            // search() calls api.search with a callback — simulate it never calling 'done'
            fakeApi.search.mockReturnValue(new Promise(() => {}));
            fakeApi.heartbeatClient.mockReturnValue(new Promise(() => {}));

            const client = new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
            client.start();

            // Collect all yielded items and the final error
            const results: unknown[] = [];
            const done = (async () => {
                try {
                    for await (const item of client.search({ filename: 'test' })) {
                        results.push(item);
                    }
                } catch (e) {
                    return e;
                }
            })();

            // Trigger heartbeat timeout → reconnect
            await jest.advanceTimersByTimeAsync(3000 + 5000);

            const error = await done;
            expect(error).toBeInstanceOf(SearchWorkerDisconnectedError);
            expect(results).toHaveLength(0);
        });

        it('stops heartbeat on dispose', () => {
            const client = new WorkerClient(USER_ID, '1.0.0', CLIENT_ID, BRIDGE);
            client.dispose();

            jest.advanceTimersByTime(10_000);
            expect(fakeApi.heartbeatClient).not.toHaveBeenCalled();
        });
    });
});
