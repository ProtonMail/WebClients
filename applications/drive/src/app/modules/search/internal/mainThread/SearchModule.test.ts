import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { getBrowser, isChrome } from '@proton/shared/lib/helpers/browser';

import { SearchModule } from './SearchModule';

jest.mock('../shared/Logger', () => ({
    Logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), listenForWorkerLogs: jest.fn() },
}));

jest.mock('../shared/searchMetrics', () => ({
    searchMetrics: { markIncompatibilityEnvironment: jest.fn() },
}));

// isEnvironmentCompatible checks isChrome()/getBrowser() by version. ua-parser-js parses
// navigator.userAgent once at module load, so mock the module directly instead - setting
// navigator.userAgent afterwards would have no effect.
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/browser'),
    isChrome: jest.fn(() => false),
    getBrowser: jest.fn(() => undefined),
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

    it('returns false when WebAssembly is not defined', async () => {
        const originalWebAssembly = global.WebAssembly;
        // @ts-expect-error - simulating an environment where the global is stripped.
        delete global.WebAssembly;

        try {
            await expect(SearchModule.isEnvironmentCompatible()).resolves.toBe(false);
        } finally {
            global.WebAssembly = originalWebAssembly;
        }
    });

    it('returns false for Chrome older than 96 (lacks WASM reference types)', async () => {
        (isChrome as jest.Mock).mockReturnValue(true);
        (getBrowser as jest.Mock).mockReturnValue({ name: 'Chrome', version: '87.0.4280.66' });

        try {
            await expect(SearchModule.isEnvironmentCompatible()).resolves.toBe(false);
        } finally {
            (isChrome as jest.Mock).mockReturnValue(false);
            (getBrowser as jest.Mock).mockReturnValue(undefined);
        }
    });

    it('returns true for Chrome 96 or newer', async () => {
        (isChrome as jest.Mock).mockReturnValue(true);
        (getBrowser as jest.Mock).mockReturnValue({ name: 'Chrome', version: '120.0.0.0' });

        try {
            await expect(SearchModule.isEnvironmentCompatible()).resolves.toBe(true);
        } finally {
            (isChrome as jest.Mock).mockReturnValue(false);
            (getBrowser as jest.Mock).mockReturnValue(undefined);
        }
    });
});
