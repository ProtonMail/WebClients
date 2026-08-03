import { type AesGcmCryptoKey, generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { Logger } from '../../lib/logger/logger';
import { loggerManager } from '../../lib/logger/manager';
import { IndexedDBStorage } from '../../lib/logger/storage';
import type { LoggerOptions } from '../../lib/logger/types';

vi.setConfig({ testTimeout: 15000 });

const DAY_MS = 24 * 60 * 60 * 1000;

let counter = 0;
const uniqueId = () => `${Date.now()}-${counter++}`;

/**
 * Opens a second connection to a logger's database for assertions, always closing it.
 * A lingering connection would block `deleteDatabase()` during teardown.
 */
const inspect = async <T>(name: string, id: string, fn: (storage: IndexedDBStorage) => Promise<T>): Promise<T> => {
    const storage = new IndexedDBStorage(name, id);
    try {
        return await fn(storage);
    } finally {
        await storage.close();
    }
};

describe('Logger', () => {
    let key: AesGcmCryptoKey;

    /** Loggers and databases to tear down, so tests never share state. */
    const loggers: Logger[] = [];
    const databases: { name: string; id: string }[] = [];

    beforeAll(async () => {
        key = await generateAndImportKey();
    });

    const options = (overrides: Partial<LoggerOptions> & { loggerID: string }): LoggerOptions => ({
        encryptionKey: key,
        appName: 'test-app',
        ...overrides,
    });

    /** Creates an initialized logger and registers it for cleanup. */
    const createLogger = async ({
        name = 'test',
        id = uniqueId(),
        now,
        ...rest
    }: Partial<LoggerOptions> & { name?: string; id?: string; now?: () => number } = {}) => {
        const logger = new Logger(name, now);
        loggers.push(logger);
        databases.push({ name, id });
        await logger.initialize(options({ ...rest, loggerID: id }));
        return logger;
    };

    afterEach(async () => {
        await Promise.all(loggers.splice(0).map((logger) => logger.destroy().catch(() => {})));
        await Promise.all(
            databases.splice(0).map(({ name, id }) => new IndexedDBStorage(name, id).deleteDatabase().catch(() => {}))
        );
        await loggerManager.destroyAll();
    });

    describe('persistence', () => {
        it('round-trips a line through IndexedDB', async () => {
            const logger = await createLogger();

            logger.info('hello world');

            const logs = await logger.getLogs();
            expect(logs).toContain('hello world');
            expect(logs).toContain('INFO');
            expect(logs).toContain('[test]');
        });

        it('writes lines in the order they were emitted', async () => {
            const logger = await createLogger();

            logger.info('first');
            logger.info('second');
            logger.info('third');

            const lines = (await logger.getLogs()).split('\n');
            expect(lines.map((line) => line.split(': ')[1])).toEqual(['first', 'second', 'third']);
        });

        it('prefixes each line with an ISO timestamp and the level', async () => {
            const at = Date.UTC(2026, 0, 2, 3, 4, 5);
            const logger = await createLogger({ now: () => at });

            logger.warn('careful');

            expect(await logger.getLogs()).toMatch(/^2026-01-02T03:04:05\.000Z WARN \[test\]: careful$/);
        });

        it('buffers lines emitted before initialize and keeps their timestamps', async () => {
            const at = Date.UTC(2026, 0, 1);
            const id = uniqueId();
            const logger = new Logger('test', () => at);
            loggers.push(logger);
            databases.push({ name: 'test', id });

            logger.info('before init');
            expect(await logger.getLogs()).toBe('');

            await logger.initialize(options({ loggerID: id }));

            const logs = await logger.getLogs();
            expect(logs).toContain('before init');
            expect(logs).toContain('2026-01-01T00:00:00.000Z');
        });

        it('persists arguments alongside the message', async () => {
            const logger = await createLogger();

            logger.info('with args', 'plain', { nested: { value: 1 } }, 42);

            const logs = await logger.getLogs();
            expect(logs).toContain('plain');
            expect(logs).toContain('{"nested":{"value":1}}');
            expect(logs).toContain('42');
        });

        it('serializes Error arguments with their stack', async () => {
            const logger = await createLogger();

            logger.info('boom', new Error('kaboom'));

            const logs = await logger.getLogs();
            expect(logs).toContain('Error: kaboom');
        });

        it('does not lose a line containing a circular argument', async () => {
            const logger = await createLogger();
            const circular: Record<string, unknown> = { name: 'loop' };
            circular.self = circular;

            logger.info('circular', circular);

            expect(await logger.getLogs()).toContain('circular');
        });

        it('encrypts entries at rest', async () => {
            const id = uniqueId();
            const logger = await createLogger({ id });

            logger.info('super secret value');
            await logger.flush();

            const stored = await inspect('test', id, (storage) => storage.retrieve());
            expect(stored).toHaveLength(1);
            expect(stored[0].data).not.toContain('super secret');
        });
    });

    describe('console output', () => {
        it('only echoes errors by default', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const info = vi.spyOn(console, 'info').mockImplementation(() => {});
            const logger = await createLogger();

            logger.info('quiet');
            logger.error('loud');

            expect(info).not.toHaveBeenCalled();
            expect(error).toHaveBeenCalledWith('[test]', 'loud');
        });

        it('respects consoleLevels', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const logger = await createLogger({ consoleLevels: ['warn'] });

            logger.warn('shown');

            expect(warn).toHaveBeenCalledWith('[test]', 'shown');
        });

        it('echoes lines emitted before initialize', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const logger = new Logger('early');
            loggers.push(logger);

            logger.error('pre-init failure');

            expect(error).toHaveBeenCalledWith('[early]', 'pre-init failure');
        });
    });

    describe('reading', () => {
        it('returns an empty string before initialize', async () => {
            const logger = new Logger('uninitialized');
            loggers.push(logger);

            expect(await logger.getLogs()).toBe('');
        });

        it('de-duplicates concurrent reads', async () => {
            const id = uniqueId();
            const logger = await createLogger({ id });
            logger.info('once');
            await logger.flush();

            const retrieve = vi.spyOn(IndexedDBStorage.prototype, 'retrieve');
            const [a, b] = await Promise.all([logger.getLogs(), logger.getLogs()]);

            expect(a).toBe(b);
            expect(retrieve).toHaveBeenCalledTimes(1);
        });

        it('sees every line emitted before the read', async () => {
            const logger = await createLogger();

            logger.info('a');
            logger.info('b');

            // No flush: getLogs awaits the write chain itself.
            expect((await logger.getLogs()).split('\n')).toHaveLength(2);
        });

        it('clears entries that cannot be decrypted', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const id = uniqueId();
            const first = await createLogger({ id });
            first.info('written with the old key');
            await first.flush();
            await first.destroy();

            // A new session key cannot read the previous session's entries.
            const second = new Logger('test');
            loggers.push(second);
            await second.initialize(options({ loggerID: id, encryptionKey: await generateAndImportKey() }));

            expect(await second.getLogs()).toBe('');
            expect(warn).toHaveBeenCalled();
            expect(await inspect('test', id, (storage) => storage.count())).toBe(0);
        });
    });

    describe('retention', () => {
        it('drops entries older than retentionDays on cleanup', async () => {
            const start = Date.UTC(2026, 0, 10);
            const id = uniqueId();

            const first = await createLogger({ id, now: () => start });
            first.info('old line');
            await first.flush();
            await first.destroy();

            // Same database, eight days later: the entry is past the 7-day default.
            const second = new Logger('test', () => start + 8 * DAY_MS);
            loggers.push(second);
            await second.initialize(options({ loggerID: id }));

            expect(await second.getLogs()).toBe('');
        });

        it('keeps entries inside the retention window', async () => {
            const start = Date.UTC(2026, 0, 10);
            const id = uniqueId();

            const first = await createLogger({ id, now: () => start });
            first.info('recent line');
            await first.flush();
            await first.destroy();

            const second = new Logger('test', () => start + 2 * DAY_MS);
            loggers.push(second);
            await second.initialize(options({ loggerID: id }));

            expect(await second.getLogs()).toContain('recent line');
        });

        it('trims to maxEntries on cleanup, keeping the newest', async () => {
            const start = Date.UTC(2026, 0, 10);
            const id = uniqueId();
            let clock = start;

            const first = await createLogger({ id, now: () => clock });
            ['one', 'two', 'three', 'four'].forEach((message) => {
                clock += 1000;
                first.info(message);
            });
            await first.flush();
            await first.destroy();

            const second = new Logger('test', () => clock);
            loggers.push(second);
            await second.initialize(options({ loggerID: id, maxEntries: 2 }));

            const logs = await second.getLogs();
            expect(logs).not.toContain('one');
            expect(logs).not.toContain('two');
            expect(logs).toContain('three');
            expect(logs).toContain('four');
        });
    });

    describe('lifecycle', () => {
        it('reports initialization state', async () => {
            const logger = new Logger('lifecycle');
            loggers.push(logger);
            expect(logger.isInitialized()).toBe(false);

            const id = uniqueId();
            databases.push({ name: 'lifecycle', id });
            await logger.initialize(options({ loggerID: id }));

            expect(logger.isInitialized()).toBe(true);
        });

        it('ignores a second initialize', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const logger = await createLogger();

            await logger.initialize(options({ loggerID: uniqueId() }));

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
        });

        it('clears logs on request', async () => {
            const logger = await createLogger();
            logger.info('temporary');
            expect(await logger.getLogs()).toContain('temporary');

            await logger.clearLogs();

            expect(await logger.getLogs()).toBe('');
        });

        it('stops logging after destroy', async () => {
            const logger = await createLogger();
            logger.info('before');

            await logger.destroy();

            expect(logger.isInitialized()).toBe(false);
            expect(await logger.getLogs()).toBe('');
            // Still callable, just inert.
            expect(() => logger.info('after')).not.toThrow();
        });

        it('downloads logs as a file', async () => {
            const anchor = { href: '', download: '', style: {}, click: vi.fn() } as unknown as HTMLAnchorElement;
            vi.spyOn(document, 'createElement').mockReturnValue(anchor as any);
            vi.spyOn(document.body, 'appendChild').mockReturnValue(anchor);
            vi.spyOn(document.body, 'removeChild').mockReturnValue(anchor);
            const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
            const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            const logger = await createLogger();
            logger.info('downloadable');
            await logger.downloadLogs();

            expect(createObjectURL).toHaveBeenCalled();
            expect(anchor.download).toMatch(/^test-logs-.*\.log$/);
            expect(anchor.click).toHaveBeenCalled();
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
        });

        it('uses an explicit download filename when given', async () => {
            const anchor = { href: '', download: '', style: {}, click: vi.fn() } as unknown as HTMLAnchorElement;
            vi.spyOn(document, 'createElement').mockReturnValue(anchor as any);
            vi.spyOn(document.body, 'appendChild').mockReturnValue(anchor);
            vi.spyOn(document.body, 'removeChild').mockReturnValue(anchor);
            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
            vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            const logger = await createLogger();
            await logger.downloadLogs('custom.log');

            expect(anchor.download).toBe('custom.log');
        });
    });

    describe('global error capture', () => {
        it('records uncaught errors', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            const logger = await createLogger();

            window.dispatchEvent(new ErrorEvent('error', { message: 'window blew up' }));

            expect(await logger.getLogs()).toContain('window blew up');
        });

        it('records unhandled rejections', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            const logger = await createLogger();
            const promise = Promise.resolve();

            window.dispatchEvent(
                new PromiseRejectionEvent('unhandledrejection', { promise, reason: new Error('rejected') })
            );

            expect(await logger.getLogs()).toContain('rejected');
        });

        it('stops recording after destroy', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            const logger = await createLogger();
            await logger.destroy();

            expect(() => window.dispatchEvent(new ErrorEvent('error', { message: 'after destroy' }))).not.toThrow();
        });
    });
});

describe('LoggerManager', () => {
    let key: AesGcmCryptoKey;
    const databases: { name: string; id: string }[] = [];

    beforeAll(async () => {
        key = await generateAndImportKey();
    });

    const create = async (name: string) => {
        const id = uniqueId();
        databases.push({ name, id });
        return loggerManager.createLogger(name, {
            encryptionKey: key,
            appName: 'test-app',
            loggerID: id,
        });
    };

    afterEach(async () => {
        // Destroy first so no connection is left blocking deletion.
        await loggerManager.destroyAll();
        await Promise.all(
            databases.splice(0).map(({ name, id }) => new IndexedDBStorage(name, id).deleteDatabase().catch(() => {}))
        );
    });

    it('returns the same instance for a name', () => {
        expect(loggerManager.getLogger('reused')).toBe(loggerManager.getLogger('reused'));
    });

    it('creates and initializes a logger in one step', async () => {
        const logger = await create('created');
        expect(logger.isInitialized()).toBe(true);
    });

    it('combines logs from every initialized logger', async () => {
        const first = await create('alpha');
        const second = await create('beta');

        first.info('from alpha');
        second.info('from beta');

        const logs = await loggerManager.getAllLogs();
        expect(logs).toContain('from alpha');
        expect(logs).toContain('from beta');
    });

    it('skips uninitialized loggers', async () => {
        const logger = await create('initialized');
        logger.info('present');
        loggerManager.getLogger('never-initialized');

        expect(await loggerManager.getAllLogs()).toContain('present');
    });

    it('clears every logger', async () => {
        const first = await create('alpha');
        const second = await create('beta');
        first.info('a');
        second.info('b');

        await loggerManager.clearAllLogs();

        expect(await loggerManager.getAllLogs()).toBe('');
    });

    it('removes a logger', async () => {
        const logger = await create('removable');

        await loggerManager.removeLogger('removable');

        expect(logger.isInitialized()).toBe(false);
        expect(loggerManager.getLogger('removable')).not.toBe(logger);
    });

    it('ignores removing an unknown logger', async () => {
        await expect(loggerManager.removeLogger('missing')).resolves.toBeUndefined();
    });
});
