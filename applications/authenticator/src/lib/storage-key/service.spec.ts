import { STORAGE_KEY_IDB_ID } from './constants';
import { createStorageKeyService } from './service';
import type { StorageKeyAdapter, StorageKeyRef, StorageKeyResult } from './types';
import { StorageKeyError, StorageKeySource } from './types';
import { formatGenerateError, formatReadError, formatResetKeyWarning, formatUnsafeStorageKeyWarning } from './utils';

const createMockAdapter = (type: StorageKeySource): jest.Mocked<StorageKeyAdapter> => ({
    type,
    read: jest.fn(),
    generate: jest.fn(),
});

const keyringAdapter = createMockAdapter(StorageKeySource.KEYRING);
const passwordAdapter = createMockAdapter(StorageKeySource.PASSWORD);
const fallbackAdapter = createMockAdapter(StorageKeySource.FALLBACK);

const createStorageKeyRef = (overrides: Partial<StorageKeyRef> = {}): StorageKeyRef => ({
    id: STORAGE_KEY_IDB_ID,
    adapterKeyId: 'adapter::keyring::test123',
    salt: new Uint8Array(32).fill(1),
    source: StorageKeySource.KEYRING,
    ...overrides,
});

const success = (key: Uint8Array<ArrayBuffer> = new Uint8Array(32).fill(2)): StorageKeyResult => ({ ok: true, key });
const error = (error: StorageKeyError = StorageKeyError.UNKNOWN): StorageKeyResult => ({ ok: false, error });

const config = {
    onStorageKey: jest.fn(),
    default: StorageKeySource.KEYRING,
    adapters: {
        [StorageKeySource.FALLBACK]: fallbackAdapter,
        [StorageKeySource.KEYRING]: keyringAdapter,
        [StorageKeySource.PASSWORD]: passwordAdapter,
    },
};

describe('StorageKeyService', () => {
    let confirm: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        keyringAdapter.read.mockResolvedValue(success());
        keyringAdapter.generate.mockResolvedValue(success());
        passwordAdapter.read.mockResolvedValue(success());
        passwordAdapter.generate.mockResolvedValue(success());
        fallbackAdapter.read.mockResolvedValue(success());
        fallbackAdapter.generate.mockResolvedValue(success());

        delete keyringAdapter.downgrade;
        delete passwordAdapter.downgrade;
        delete fallbackAdapter.downgrade;

        config.onStorageKey.mockImplementation(async (_, options) => options.onSaved());
        confirm = jest.fn().mockResolvedValue(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('StorageKeyService::init', () => {
        test('should call `generate` when `keyRef` is missing', async () => {
            const service = createStorageKeyService(config);
            const generate = jest.spyOn(service, 'generate').mockResolvedValue();
            await service.init({ confirm });

            expect(generate).toHaveBeenCalledWith({ source: StorageKeySource.KEYRING, confirm });
        });

        test('should use default source when `keyRef` is missing', async () => {
            const service = createStorageKeyService({ ...config, default: StorageKeySource.PASSWORD });
            const generate = jest.spyOn(service, 'generate').mockResolvedValue();
            await service.init({ confirm });

            expect(generate).toHaveBeenCalledWith({ source: StorageKeySource.PASSWORD, confirm });
        });

        test('should read from adapter when `keyRef` provided', async () => {
            const service = createStorageKeyService(config);
            const keyRef = createStorageKeyRef();
            await service.init({ keyRef, confirm });
            const source = service.source;
            const storageKey = service.read();

            expect(keyringAdapter.read).toHaveBeenCalledWith(keyRef);
            expect(source).toEqual(StorageKeySource.KEYRING);
            expect(storageKey).not.toBe(undefined);
        });

        test('should retry on `adapter::read` error when confirmed', async () => {
            keyringAdapter.read.mockResolvedValueOnce(error());
            confirm.mockResolvedValueOnce(true);

            const service = createStorageKeyService(config);
            const keyRef = createStorageKeyRef();
            const generate = jest.spyOn(service, 'generate').mockResolvedValue();
            await service.init({ keyRef, confirm });

            expect(generate).not.toHaveBeenCalled();
            expect(confirm).toHaveBeenCalledWith({
                message: formatReadError(StorageKeyError.UNKNOWN),
                warning: formatResetKeyWarning(),
                cancelable: true,
                operation: 'read',
            });
        });

        test('should generate new key on `adapter::read` error when not confirmed', async () => {
            keyringAdapter.read.mockResolvedValueOnce(error(StorageKeyError.UNKNOWN));
            confirm.mockResolvedValueOnce(false);

            const service = createStorageKeyService(config);
            const keyRef = createStorageKeyRef();
            const generate = jest.spyOn(service, 'generate').mockResolvedValue();
            await service.init({ keyRef, confirm });

            expect(confirm).toHaveBeenCalled();
            expect(generate).toHaveBeenCalledWith({ source: StorageKeySource.KEYRING, confirm });
        });

        test('should return early if storage key already initialized', async () => {
            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            const generate = jest.spyOn(service, 'generate');
            await service.init({ confirm });

            expect(generate).not.toHaveBeenCalled();
        });

        test('should handle corrupted salt error [wrong length]', async () => {
            confirm.mockResolvedValueOnce(false);

            const service = createStorageKeyService(config);
            const keyRef = createStorageKeyRef({ salt: new Uint8Array(16).fill(1) });
            const generate = jest.spyOn(service, 'generate').mockResolvedValue();
            await service.init({ keyRef, confirm });

            expect(generate).toHaveBeenCalledWith({ source: StorageKeySource.KEYRING, confirm });
        });

        test('should handle different `StorageKeyError` types', async () => {
            keyringAdapter.read.mockResolvedValueOnce(error(StorageKeyError.CORRUPTED));
            confirm.mockResolvedValueOnce(false);

            const service = createStorageKeyService(config);
            const keyRef = createStorageKeyRef();
            const generate = jest.spyOn(service, 'generate').mockResolvedValue();
            await service.init({ keyRef, confirm });

            expect(generate).toHaveBeenCalled();
        });
    });

    describe('StorageKeyService::generate', () => {
        test('should call `adapter::generate` with generated `adapterKeyId`', async () => {
            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(keyringAdapter.generate).toHaveBeenCalledWith(expect.stringMatching(/^adapter::0::.+$/));

            expect(config.onStorageKey).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: STORAGE_KEY_IDB_ID,
                    adapterKeyId: expect.stringMatching(/^adapter::0::.+$/),
                    source: StorageKeySource.KEYRING,
                }),
                expect.objectContaining({ rotated: false })
            );
        });

        test('should generate unique `adapterKeyIds` for multiple calls', async () => {
            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });
            await service.generate({ source: StorageKeySource.PASSWORD, confirm });

            const keyringCall = keyringAdapter.generate.mock.calls[0][0];
            const passwordCall = passwordAdapter.generate.mock.calls[0][0];

            expect(keyringCall).toMatch(/^adapter::0::.+$/);
            expect(passwordCall).toMatch(/^adapter::1::.+$/);
        });

        test('should gracefully handle successful retry', async () => {
            confirm.mockResolvedValueOnce(true);

            keyringAdapter.generate
                .mockResolvedValueOnce(error(StorageKeyError.UNKNOWN))
                .mockResolvedValueOnce(success());

            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(confirm).toHaveBeenCalledWith({
                message: formatGenerateError(StorageKeyError.UNKNOWN),
                cancelable: false,
                operation: 'generate',
                warning: undefined,
            });

            expect(keyringAdapter.generate).toHaveBeenCalledTimes(2);
        });

        test('should try downgrading adapter when not confirmed and downgrade available', async () => {
            keyringAdapter.downgrade = StorageKeySource.FALLBACK;
            keyringAdapter.generate.mockResolvedValueOnce(error(StorageKeyError.UNKNOWN));
            confirm.mockResolvedValueOnce(false);

            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(fallbackAdapter.generate).toHaveBeenCalledWith(expect.stringMatching(/^adapter::2::.+$/));
        });

        test('should throw error when adapter generation fails and no downgrade available', async () => {
            keyringAdapter.generate.mockResolvedValueOnce(error(StorageKeyError.UNKNOWN));
            confirm.mockResolvedValueOnce(false);

            const service = createStorageKeyService(config);

            await expect(service.generate({ source: StorageKeySource.KEYRING, confirm })).rejects.toThrow(
                'Storage key generation failure: Failed generating storage key'
            );
        });

        test('should show unsafe warning when downgrading to fallback adapter', async () => {
            keyringAdapter.downgrade = StorageKeySource.FALLBACK;
            keyringAdapter.generate.mockResolvedValueOnce(error(StorageKeyError.UNKNOWN));
            confirm.mockResolvedValueOnce(false);

            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(confirm).toHaveBeenCalledWith({
                message: formatGenerateError(StorageKeyError.UNKNOWN),
                cancelable: true,
                operation: 'generate',
                warning: formatUnsafeStorageKeyWarning(true),
            });
        });

        test('should skip generation when service already has same source', async () => {
            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            keyringAdapter.generate.mockClear();
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(keyringAdapter.generate).not.toHaveBeenCalled();
        });

        test('should rollback state when `onStorageKey` callback throws', async () => {
            const service = createStorageKeyService(config);
            const onStorageKeyError = new Error('Storage callback failed');
            config.onStorageKey.mockRejectedValueOnce(onStorageKeyError);

            await expect(service.generate({ source: StorageKeySource.KEYRING, confirm })).rejects.toThrow(
                'Storage key generation failure'
            );
        });

        test('should set `unsafe_key` for fallback adapter', async () => {
            const service = createStorageKeyService(config);
            const key = new Uint8Array(32).fill(5);
            fallbackAdapter.generate.mockResolvedValueOnce(success(key));

            await service.generate({ source: StorageKeySource.FALLBACK, confirm });

            expect(config.onStorageKey).toHaveBeenCalledWith(
                expect.objectContaining({ source: StorageKeySource.FALLBACK, unsafe_key: key }),
                expect.objectContaining({ rotated: false, onSaved: expect.any(Function) })
            );
        });

        test('should pass `rotated: true` when generating a new key after existing one', async () => {
            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });
            config.onStorageKey.mockClear();

            await service.generate({ source: StorageKeySource.PASSWORD, confirm });

            expect(config.onStorageKey).toHaveBeenCalledWith(
                expect.objectContaining({ source: StorageKeySource.PASSWORD }),
                expect.objectContaining({ rotated: true, onSaved: expect.any(Function) })
            );
        });

        test('should not set unsafe_key for non-fallback adapters', async () => {
            const service = createStorageKeyService(config);
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(config.onStorageKey).toHaveBeenCalledWith(
                expect.objectContaining({ source: StorageKeySource.KEYRING, unsafe_key: undefined }),
                expect.objectContaining({ rotated: false, onSaved: expect.any(Function) })
            );
        });

        test('should call `onSaved` if not called during `onStorageKey`', async () => {
            const service = createStorageKeyService(config);
            config.onStorageKey.mockImplementation(async () => {});
            await service.generate({ source: StorageKeySource.KEYRING, confirm });

            expect(service.source).toBe(StorageKeySource.KEYRING);
        });

        test('should throw error for unsupported adapter type', async () => {
            const service = createStorageKeyService(config);
            confirm.mockResolvedValueOnce(false);

            await expect(() =>
                service.generate({ source: 'unsupported' as unknown as StorageKeySource, confirm })
            ).rejects.toThrow('Unsupported storage key adapter');
        });
    });

    describe('StorageKeyService::instance', () => {
        test('should throw error when reading uninitialized storage key', () => {
            const service = createStorageKeyService(config);
            expect(() => service.read()).toThrow('Storage key not initialized');
        });

        test('should publish events when state changes', async () => {
            const service = createStorageKeyService(config);
            const listener = jest.fn();
            service.listen(listener);

            await service.generate({ source: StorageKeySource.KEYRING, confirm });
            expect(listener).toHaveBeenCalledWith({ type: 'storage_key', source: StorageKeySource.KEYRING });
        });

        test('should return correct source after initialization', async () => {
            passwordAdapter.read.mockResolvedValueOnce(success());

            const service = createStorageKeyService(config);
            const keyRef = createStorageKeyRef({ source: StorageKeySource.PASSWORD });
            await service.init({ keyRef, confirm });

            expect(service.source).toBe(StorageKeySource.PASSWORD);
            expect(service.read()).not.toBe(undefined);
        });
    });

    describe('StorageKeyService::legacy compatibility', () => {
        test('should read legacy storage key without `adapterKeyId`', async () => {
            const service = createStorageKeyService(config);
            const legacyKeyRef = createStorageKeyRef({ adapterKeyId: undefined });
            await service.init({ keyRef: legacyKeyRef, confirm });

            expect(keyringAdapter.read).toHaveBeenCalledWith(expect.objectContaining(legacyKeyRef));
            expect(service.source).toBe(StorageKeySource.KEYRING);
        });

        test('should generate `adapterKeyId` for new keys after legacy migration', async () => {
            const service = createStorageKeyService(config);
            const legacyKeyRef = createStorageKeyRef({ adapterKeyId: undefined });
            await service.init({ keyRef: legacyKeyRef, confirm });
            await service.generate({ source: StorageKeySource.PASSWORD, confirm });

            expect(config.onStorageKey).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    id: STORAGE_KEY_IDB_ID,
                    adapterKeyId: expect.stringMatching(/^adapter::1::.+$/),
                    source: StorageKeySource.PASSWORD,
                }),
                expect.objectContaining({ rotated: true })
            );
        });
    });
});
