import { WASM_WORKER_READY_EVENT } from '@proton/pass/lib/core/constants';
import type { Maybe } from '@proton/pass/types';

import { wasmWorkerServiceFactory } from './wasm.worker.service';

type TestMethods = {
    add: { args: [number, number]; return: number };
    sendBuffer: { args: [Uint8Array<ArrayBuffer>]; return: Uint8Array<ArrayBuffer> };
};

const createMessagePort = (): MessagePort =>
    ({
        close: jest.fn(),
        addEventListener: jest.fn(),
        onmessage: null,
    }) as any;

const createMessageChannel = (): MessageChannel => {
    const port1 = createMessagePort();
    const port2 = createMessagePort();
    return { port1, port2 } as any;
};

const createWorker = () => ({
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
});

describe('`wasmWorkerServiceFactory`', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should create a singleton instance', () => {
        const worker = createWorker();
        const spawn = jest.fn(() => worker as unknown as Worker);
        const channelFactory = jest.fn(() => createMessageChannel());

        const service = wasmWorkerServiceFactory<TestMethods>({ id: 'TestWorker', spawn }, channelFactory);

        void service.exec;
        void service.transfer;

        expect(spawn).toHaveBeenCalledTimes(1);
        expect(worker.addEventListener).toHaveBeenCalledTimes(1);
    });

    test('should handle success response correctly', async () => {
        const worker = createWorker();
        const channel = createMessageChannel();
        const spawn = jest.fn(() => worker as unknown as Worker);
        const channelFactory = jest.fn(() => channel);

        const service = wasmWorkerServiceFactory<TestMethods>({ id: 'TestWorker', spawn }, channelFactory);
        const exec = service.exec('add', 1, 2);

        const readyCallback = worker.addEventListener.mock.calls[0][1];
        readyCallback({ data: { type: WASM_WORKER_READY_EVENT } });

        await jest.advanceTimersToNextTimerAsync();

        const [workerMessage] = worker.postMessage.mock.calls[0];
        const onMessage = channel.port2.onmessage as (ev: MessageEvent) => void;
        onMessage({ data: { ok: true, value: 3 } } as any);

        await expect(exec).resolves.toBe(3);
        expect(workerMessage).toEqual({ method: 'add', args: [1, 2] });
        expect(channel.port1.close).toHaveBeenCalled();
        expect(channel.port2.close).toHaveBeenCalled();
    });

    test('should handle error response correctly', async () => {
        let error: Maybe<Error>;

        const worker = createWorker();
        const channel = createMessageChannel();
        const spawn = jest.fn(() => worker as unknown as Worker);
        const channelFactory = jest.fn(() => channel);

        const service = wasmWorkerServiceFactory<TestMethods>({ id: 'TestWorker', spawn }, channelFactory);
        const exec = service.exec('add', 1, 2).catch((err) => (error = err));

        const readyCallback = worker.addEventListener.mock.calls[0][1];
        readyCallback({ data: { type: WASM_WORKER_READY_EVENT } });

        await jest.advanceTimersToNextTimerAsync();

        const onMessage = channel.port2.onmessage as (ev: MessageEvent) => void;
        onMessage({ data: { ok: false, error: 'Operation failed' } } as any);

        await exec;

        expect(error).toMatchObject({ name: 'TestWorkerError', message: 'Operation failed' });
        expect(channel.port1.close).toHaveBeenCalled();
        expect(channel.port2.close).toHaveBeenCalled();
    });

    test('should handle procedure timeout correctly', async () => {
        let error: Maybe<Error>;

        const worker = createWorker();
        const channel = createMessageChannel();
        const spawn = jest.fn(() => worker as unknown as Worker);
        const channelFactory = jest.fn(() => channel);

        const service = wasmWorkerServiceFactory<TestMethods>({ id: 'TestWorker', spawn }, channelFactory);

        const exec = service.exec('add', 1, 2).catch((err) => (error = err));

        const readyCallback = worker.addEventListener.mock.calls[0][1];
        readyCallback({ data: { type: WASM_WORKER_READY_EVENT } });

        await jest.runAllTimersAsync();
        await exec;

        expect(error).toMatchObject({ name: 'TestWorkerError', message: 'Procedure timed out [add]' });
        expect(channel.port1.close).toHaveBeenCalled();
        expect(channel.port2.close).toHaveBeenCalled();
    });

    test('should transfer transferables correctly', async () => {
        const worker = createWorker();
        const channel = createMessageChannel();
        const spawn = jest.fn(() => worker as unknown as Worker);
        const channelFactory = jest.fn(() => channel);

        const service = wasmWorkerServiceFactory<TestMethods>({ id: 'TestWorker', spawn }, channelFactory);

        const arr = new Uint8Array(16);
        const exec = service.transfer([arr.buffer])('sendBuffer', arr);

        const readyCallback = worker.addEventListener.mock.calls[0][1];
        readyCallback({ data: { type: WASM_WORKER_READY_EVENT } });

        await jest.advanceTimersToNextTimerAsync();

        const [message, transferList] = worker.postMessage.mock.calls[0];
        expect(message).toEqual({ method: 'sendBuffer', args: [arr] });
        expect(transferList).toContain(arr.buffer);

        const value = new ArrayBuffer(16);
        const onMessage = channel.port2.onmessage as (ev: MessageEvent) => void;
        onMessage({ data: { ok: true, value } } as any);

        await expect(exec).resolves.toBe(value);
        expect(channel.port1.close).toHaveBeenCalled();
        expect(channel.port2.close).toHaveBeenCalled();
    });
});
