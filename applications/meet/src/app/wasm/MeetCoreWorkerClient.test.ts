import { MeetCoreWorkerClient } from './MeetCoreWorkerClient';
import { MeetCoreRestartedError } from './meetCoreStallRecovery';
import type { MeetCoreInitParams } from './meetCoreWorkerProtocol';

class FakeWorker {
    public static instances: FakeWorker[] = [];

    public readonly posted: any[] = [];
    public terminated = false;
    private readonly listeners = new Map<string, (event: any) => void>();

    public constructor() {
        FakeWorker.instances.push(this);
    }

    public addEventListener(type: string, listener: (event: any) => void) {
        this.listeners.set(type, listener);
    }

    public removeEventListener(type: string) {
        this.listeners.delete(type);
    }

    public postMessage(message: any) {
        this.posted.push(message);
    }

    public terminate() {
        this.terminated = true;
    }

    public respond(data: unknown) {
        this.listeners.get('message')?.({ data });
    }

    public ackInit() {
        const init = this.posted.find((message) => message.type === 'meet-core:init');
        this.respond({ type: 'meet-core:init-result', id: init.id, ok: true });
    }
}

const initParams = { env: 'env' } as MeetCoreInitParams;

const createInitializedClient = async () => {
    const client = new MeetCoreWorkerClient();
    const initPromise = client.init(initParams);
    FakeWorker.instances[0].ackInit();
    await initPromise;
    return client;
};

describe('MeetCoreWorkerClient.restart', () => {
    beforeEach(() => {
        FakeWorker.instances = [];
        vi.stubGlobal('Worker', FakeWorker);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('terminates the worker, rejects pending calls and initializes a new worker with the same params', async () => {
        const client = await createInitializedClient();
        const [oldWorker] = FakeWorker.instances;

        const pendingLeave = client.leaveMeeting();
        const restartPromise = client.restart();

        expect(oldWorker.terminated).toBe(true);
        await expect(pendingLeave).rejects.toBeInstanceOf(MeetCoreRestartedError);

        const newWorker = FakeWorker.instances[1];
        expect(newWorker.posted).toEqual([expect.objectContaining({ type: 'meet-core:init', params: initParams })]);

        newWorker.ackInit();
        await expect(restartPromise).resolves.toBe(true);
    });

    it('holds calls made during the restart until the new worker is ready', async () => {
        const client = await createInitializedClient();

        const restartPromise = client.restart();
        const leavePromise = client.leaveMeeting();
        const newWorker = FakeWorker.instances[1];

        expect(newWorker.posted.some((message) => message.method === 'leaveMeeting')).toBe(false);

        newWorker.ackInit();
        await restartPromise;
        await vi.waitFor(() => {
            expect(newWorker.posted.some((message) => message.method === 'leaveMeeting')).toBe(true);
        });

        const leave = newWorker.posted.find((message) => message.method === 'leaveMeeting');
        newWorker.respond({
            type: 'meet-core:rpc-result',
            id: leave.id,
            method: 'leaveMeeting',
            ok: true,
            result: undefined,
        });
        await expect(leavePromise).resolves.toBeUndefined();
    });

    it('shares a restart that is already in progress', async () => {
        const client = await createInitializedClient();

        const first = client.restart();
        const second = client.restart();

        expect(second).toBe(first);
        expect(FakeWorker.instances).toHaveLength(2);
    });

    it('resolves false and fails later calls when the new worker cannot initialize', async () => {
        const client = await createInitializedClient();

        const restartPromise = client.restart();
        const newWorker = FakeWorker.instances[1];
        const init = newWorker.posted[0];
        newWorker.respond({
            type: 'meet-core:init-result',
            id: init.id,
            ok: false,
            error: { kind: 'error', message: 'init failed' },
        });

        await expect(restartPromise).resolves.toBe(false);
        expect(newWorker.terminated).toBe(true);
        await expect(client.leaveMeeting()).rejects.toThrow('init failed');
    });

    it('does not restart a disposed client', async () => {
        const client = await createInitializedClient();
        client.dispose();

        await expect(client.restart()).resolves.toBe(false);
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it('does not restart a client that was never initialized', async () => {
        const client = new MeetCoreWorkerClient();

        await expect(client.restart()).resolves.toBe(false);
        expect(FakeWorker.instances).toHaveLength(1);
    });
});
