import * as Comlink from 'comlink';

import type { LogReaderOptions } from './LogReader';
import { readLogsInWorker } from './readLogsInWorker';

jest.mock('comlink');

/** Comlink is mocked, so termination is the only part of `Worker` these tests exercise. */
class FakeWorker {
    terminate = jest.fn();
}

describe('readLogsInWorker', () => {
    const options: LogReaderOptions = {
        name: 'test',
        loggerID: 'id',
        encryptionKey: {} as LogReaderOptions['encryptionKey'],
        encryptionContext: 'ctx',
    };

    let worker: FakeWorker;

    beforeEach(() => {
        worker = new FakeWorker();
        global.Worker = jest.fn(() => worker) as unknown as typeof Worker;
    });

    it('initializes before reading, returns the result, and terminates the worker', async () => {
        const init = jest.fn().mockResolvedValue(undefined);
        const getLogs = jest.fn().mockResolvedValue('the logs');
        jest.mocked(Comlink.wrap).mockReturnValue({ init, getLogs } as any);

        const result = await readLogsInWorker(options);

        expect(result).toBe('the logs');
        expect(init).toHaveBeenCalledWith(options);
        expect(init.mock.invocationCallOrder[0]).toBeLessThan(getLogs.mock.invocationCallOrder[0]);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
    });

    it('terminates the worker even when init rejects', async () => {
        const init = jest.fn().mockRejectedValue(new Error('init failed'));
        jest.mocked(Comlink.wrap).mockReturnValue({ init, getLogs: jest.fn() } as any);

        await expect(readLogsInWorker(options)).rejects.toThrow('init failed');
        expect(worker.terminate).toHaveBeenCalledTimes(1);
    });
});
