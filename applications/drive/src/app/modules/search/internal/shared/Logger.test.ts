describe('Logger never throws', () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;

    afterEach(() => {
        Reflect.set(globalThis, 'BroadcastChannel', originalBroadcastChannel);
        Reflect.deleteProperty(globalThis, 'SharedWorkerGlobalScope');
        jest.resetModules();
    });

    /**
     * `isWorker` and the log channel are both resolved once at module load, so the worker branch can
     * only be reached by installing the fake and the global before a fresh import. Without this the
     * whole suite runs main-thread-only and the BroadcastChannel path - the one that actually fails
     * in production, while the worker is shutting down - is never covered.
     */
    const importLoggerAsWorker = async (failure: DOMException) => {
        class DeadBroadcastChannel {
            postMessage(): void {
                throw failure;
            }

            close(): void {}
        }

        Reflect.set(globalThis, 'SharedWorkerGlobalScope', class {});
        Reflect.set(globalThis, 'BroadcastChannel', DeadBroadcastChannel);
        jest.resetModules();
        return import('./Logger');
    };

    it('swallows a dead log channel in the worker', async () => {
        const { Logger } = await importLoggerAsWorker(new DOMException('channel is closed', 'InvalidStateError'));

        // Every level goes through the same dispatch, and info/warn are called from ordinary
        // indexing loops - a throw there would break indexing itself, not just the logging.
        expect(() => Logger.info('indexing something')).not.toThrow();
        expect(() => Logger.warn('careful')).not.toThrow();
        expect(() => Logger.error('boom', new Error('cause'))).not.toThrow();
    });

    it('swallows a payload that cannot be structured-cloned', async () => {
        const { Logger } = await importLoggerAsWorker(new DOMException('could not be cloned', 'DataCloneError'));

        expect(() => Logger.error('boom', () => 'not cloneable')).not.toThrow();
    });
});
