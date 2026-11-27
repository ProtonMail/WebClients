import { deferMeetCoreClient } from './DeferredMeetCoreClient';
import type { MeetCoreClient } from './MeetCoreClient';
import { createMeetCoreClientMock } from './__mocks__/MeetCoreClient.mock';

const createDeferred = () => {
    let resolve: (client: MeetCoreClient) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const start = vi.fn(
        () =>
            new Promise<MeetCoreClient>((resolveStart, rejectStart) => {
                resolve = resolveStart;
                reject = rejectStart;
            })
    );
    const client = deferMeetCoreClient(start);
    return { client, start, resolve, reject };
};

const lifecycleMethods = ['whenReady', 'dispose'];
const forwardedMethods = (Object.keys(createMeetCoreClientMock()) as (keyof MeetCoreClient)[]).filter(
    (method) => !lifecycleMethods.includes(method)
);

describe('deferMeetCoreClient', () => {
    it('starts initializing once, on creation', () => {
        const { start } = createDeferred();

        expect(start).toHaveBeenCalledTimes(1);
    });

    it.each(forwardedMethods)('forwards %s made before the client is ready once it is', async (method) => {
        const result = Symbol(method);
        const inner = createMeetCoreClientMock({ [method]: vi.fn().mockResolvedValue(result) });
        const { client, resolve } = createDeferred();

        const pending = (client[method] as (...args: unknown[]) => Promise<unknown>)('first', 2);
        expect(inner[method]).not.toHaveBeenCalled();

        resolve(inner);

        await expect(pending).resolves.toBe(result);
        expect(inner[method]).toHaveBeenCalledWith('first', 2);
        expect(inner[method].mock.contexts[0]).toBe(inner);
    });

    it('rejects every call with the init error when the start fails', async () => {
        const { client, start, reject } = createDeferred();
        const error = new Error('init failed');

        const pending = client.leaveMeeting();
        const ready = client.whenReady();
        reject(error);

        await expect(pending).rejects.toBe(error);
        await expect(ready).rejects.toBe(error);
        await expect(client.logJoinedRoom()).rejects.toBe(error);
        expect(start).toHaveBeenCalledTimes(1);
    });

    it('resolves whenReady once the client is ready', async () => {
        const { client, resolve } = createDeferred();
        let isReady = false;
        void client.whenReady().then(() => {
            isReady = true;
        });

        await Promise.resolve();
        expect(isReady).toBe(false);

        resolve(createMeetCoreClientMock());
        await vi.waitFor(() => expect(isReady).toBe(true));
    });

    it('disposes a pending client once it resolves', async () => {
        const inner = createMeetCoreClientMock();
        const { client, resolve } = createDeferred();

        client.dispose();
        expect(inner.dispose).not.toHaveBeenCalled();

        resolve(inner);

        await vi.waitFor(() => expect(inner.dispose).toHaveBeenCalledTimes(1));
    });

    it('disposes a client that is already ready', async () => {
        const inner = createMeetCoreClientMock();
        const client = deferMeetCoreClient(() => Promise.resolve(inner));
        await client.ping();

        client.dispose();

        await vi.waitFor(() => expect(inner.dispose).toHaveBeenCalledTimes(1));
    });
});
