import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchModule } from './SearchModule';

jest.mock('../shared/Logger', () => ({
    Logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), listenForWorkerLogs: jest.fn() },
}));

jest.mock('../shared/searchMetrics', () => ({
    searchMetrics: { markIncompatibilityEnvironment: jest.fn() },
}));

// isEnvironmentCompatible also checks for SharedWorker support - jsdom doesn't define it.
global.SharedWorker = class {} as unknown as typeof SharedWorker;

describe('SearchModule.isEnvironmentCompatible', () => {
    beforeEach(() => {
        indexedDB = new IDBFactory();
    });

    it('returns true when the IndexedDB probe succeeds', async () => {
        await expect(SearchModule.isEnvironmentCompatible()).resolves.toBe(true);
    });

    it('returns false when IndexedDB is defined but fails to open', async () => {
        const failingRequest = {} as IDBOpenDBRequest;
        globalThis.indexedDB = {
            ...indexedDB,
            open: () => {
                queueMicrotask(() => failingRequest.onerror?.(new Event('error')));
                return failingRequest;
            },
        } as unknown as IDBFactory;

        await expect(SearchModule.isEnvironmentCompatible()).resolves.toBe(false);
    });
});
