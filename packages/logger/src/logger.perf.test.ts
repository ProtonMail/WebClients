import { type AesGcmCryptoKey, generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';

import { generateSyntheticLogCalls } from './fixtures';
import { Logger } from './logger';
import { IndexedDBStorage } from './storage';
import type { LogReaderOptions } from './worker/LogReader';
import LogReader from './worker/LogReader';

const ENTRY_COUNT = 1_000;
const TEST_TIMEOUT_MS = 5_000;

const uniqueId = () => crypto.randomUUID();

/** Stands in for the real worker: runs the same `LogReader` in-process. */
const inProcessReader = (options: LogReaderOptions): Promise<string> => {
    const reader = new LogReader();
    reader.init(options);
    return reader.getLogs();
};

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

/**
 * Budgets are generous on purpose and are here to catch an accidental O(n^2) loop or a large regression
 * that would affect the performance of the logger.
 */
const BUDGET_MS = {
    encryptAvg: 0.5,
    storeAvg: 0.5,
    writeAllTotal: 500,
    readAll: 500,
};

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const measuredDurations = (namePrefix: string): number[] =>
    performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.startsWith(namePrefix))
        .map((entry) => entry.duration);

describe('logger performance', () => {
    let key: AesGcmCryptoKey;
    const loggers: Logger[] = [];
    const databases: { name: string; id: string }[] = [];

    beforeAll(async () => {
        key = await generateAndImportKey();
    });

    beforeEach(() => {
        performance.clearMarks();
        performance.clearMeasures();
    });

    /** Creates an initialized logger and registers it for cleanup. */
    const createLogger = async (name: string, id: string) => {
        const logger = new Logger(undefined, inProcessReader);
        loggers.push(logger);
        databases.push({ name, id });
        await logger.initialize({ encryptionKey: key, appName: name, loggerID: id, consoleLevels: [] });
        return logger;
    };

    afterEach(async () => {
        await Promise.all(loggers.splice(0).map((logger) => logger.destroy().catch(() => {})));
        await Promise.all(
            databases.splice(0).map(({ name, id }) => new IndexedDBStorage(name, id).deleteDatabase().catch(() => {}))
        );
    });

    it(
        `write ${ENTRY_COUNT} realistic lines within budget`,
        async () => {
            const logs = generateSyntheticLogCalls(ENTRY_COUNT);
            const id = uniqueId();

            const logger = await createLogger('perf-write', id);

            const start = performance.now();
            logs.forEach((log) => logger[log.level](log.message, ...log.args));
            await logger.flush();
            const elapsed = performance.now() - start;

            const avgEncrpty = average(measuredDurations('logger-perf-write:persist:encrypt'));
            const avgStore = average(measuredDurations('logger-storage:store'));

            expect(elapsed).toBeLessThan(BUDGET_MS.writeAllTotal);
            expect(avgEncrpty).toBeLessThan(BUDGET_MS.encryptAvg);
            expect(avgStore).toBeLessThan(BUDGET_MS.storeAvg);
        },
        TEST_TIMEOUT_MS
    );

    it(
        `read ${ENTRY_COUNT} realistic lines within budget`,
        async () => {
            const logs = generateSyntheticLogCalls(ENTRY_COUNT);
            const id = uniqueId();

            const logger = await createLogger('perf-read', id);

            // Write data to the logger, no performance measurement here
            logs.forEach((log) => logger[log.level](log.message, ...log.args));
            await logger.flush();

            const start = performance.now();
            const logLines = await logger.getLogs();
            const elapsed = performance.now() - start;
            const entriesCount = await inspect('perf-read', id, (storage) => storage.count());

            expect(logLines).not.toBe('');
            expect(entriesCount).toBe(ENTRY_COUNT);
            expect(elapsed).toBeLessThan(BUDGET_MS.readAll);
        },
        TEST_TIMEOUT_MS
    );
});
