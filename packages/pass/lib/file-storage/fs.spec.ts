import type { FileStorage } from '@proton/pass/lib/file-storage/types';
import * as browserUtils from '@proton/shared/lib/helpers/browser';

import { getSupportedFileStorage, onStorageFallback } from './fs';
import * as IDB from './fs.idb';
import * as MEMORY from './fs.memory';
import * as OPFS from './fs.opfs';

describe('file-storage/fs', () => {
    const isSafari = jest.spyOn(browserUtils, 'isSafari').mockImplementation(() => false);
    const openPassFileDB = jest.spyOn(IDB, 'openPassFileDB').mockResolvedValue({} as any);
    const self = global as any;

    beforeEach(() => {
        self.BUILD_TARGET = 'chrome';

        Object.defineProperty(global.navigator, 'storage', {
            value: { getDirectory: jest.fn() },
            configurable: true,
        });

        Object.defineProperty(global, 'indexedDB', {
            value: {},
            configurable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSupportedFileStorage', () => {
        test('returns OPFS when supported and requested', () => {
            const storage = getSupportedFileStorage({ OPFS: true, IDB: true });
            expect(storage).toBeInstanceOf(OPFS.FileStorageOPFS);
        });

        test('returns IDB when OPFS not supported but IDB is', () => {
            delete self.navigator.storage;
            const storage = getSupportedFileStorage({ OPFS: true, IDB: true });
            expect(storage).toBeInstanceOf(IDB.FileStorageIDB);
        });

        test('returns Memory when both OPFS and IDB not supported', () => {
            delete self.navigator.storage;
            delete self.indexedDB;
            const storage = getSupportedFileStorage({ OPFS: true, IDB: true });
            expect(storage).toBeInstanceOf(MEMORY.FileStorageMemory);
        });

        test('respects options when choosing storage', () => {
            const storage = getSupportedFileStorage({ OPFS: false, IDB: true });
            expect(storage).toBeInstanceOf(IDB.FileStorageIDB);
        });

        test('respects safari build target for OPFS support', () => {
            self.BUILD_TARGET = 'safari';
            const storage = getSupportedFileStorage({ OPFS: true, IDB: true });
            expect(storage).toBeInstanceOf(IDB.FileStorageIDB);
        });

        test('respects safari browser for OPFS support', () => {
            isSafari.mockReturnValue(true);
            const storage = getSupportedFileStorage({ OPFS: true, IDB: true });
            expect(storage).toBeInstanceOf(IDB.FileStorageIDB);
        });
    });

    describe('onStorageFallback', () => {
        test('falls back to IDB when OPFS fails', async () => {
            self.navigator.storage.getDirectory.mockRejectedValue(new Error());

            let instance: FileStorage = new OPFS.FileStorageOPFS();
            const onSwitch = jest.fn((val: FileStorage) => (instance = val));
            const onReady = jest.fn();

            await onStorageFallback(instance, onSwitch, onReady);

            expect(onSwitch).toHaveBeenCalledTimes(1);
            expect(instance).toBeInstanceOf(IDB.FileStorageIDB);
            expect(onReady).toHaveBeenCalled();
        });

        test('falls back to Memory when IDB fails', async () => {
            openPassFileDB.mockRejectedValue(new Error());

            let instance: FileStorage = new IDB.FileStorageIDB();
            const onSwitch = jest.fn((val: FileStorage) => (instance = val));
            const onReady = jest.fn();

            await onStorageFallback(instance, onSwitch, onReady);

            expect(onSwitch).toHaveBeenCalledTimes(1);
            expect(instance).toBeInstanceOf(MEMORY.FileStorageMemory);
            expect(onReady).toHaveBeenCalled();
        });

        test('falls back from OPFS to Memory as last resort', async () => {
            self.navigator.storage.getDirectory.mockRejectedValue(new Error());
            openPassFileDB.mockRejectedValue(new Error());

            let instance: FileStorage = new OPFS.FileStorageOPFS();
            const onSwitch = jest.fn((val: FileStorage) => (instance = val));
            const onReady = jest.fn();

            await onStorageFallback(instance, onSwitch, onReady);

            expect(onSwitch).toHaveBeenCalledTimes(2);
            expect(instance).toBeInstanceOf(MEMORY.FileStorageMemory);
            expect(onReady).toHaveBeenCalled();
        });

        test('calls `onReady` when no fallback needed', async () => {
            self.navigator.storage.getDirectory.mockResolvedValue({});

            let instance: FileStorage = new OPFS.FileStorageOPFS();
            const onSwitch = jest.fn();
            const onReady = jest.fn();

            await onStorageFallback(instance, onSwitch, onReady);

            expect(onSwitch).not.toHaveBeenCalled();
            expect(onReady).toHaveBeenCalled();
        });
    });
});
