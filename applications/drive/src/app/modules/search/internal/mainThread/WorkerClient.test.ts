import type { ClientId, UserId } from '../shared/types';
import type { MainThreadBridge } from './MainThreadBridge';
// Import after mocks are set up.
import { WorkerClient } from './WorkerClient';

const fakeApi = {
    registerClient: jest.fn(),
    heartbeatClient: jest.fn(),
    disconnectClient: jest.fn(),
};

jest.mock('comlink', () => ({
    wrap: () => fakeApi,
    proxy: (x: unknown) => x,
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
});
