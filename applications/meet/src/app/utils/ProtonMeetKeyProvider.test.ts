import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProtonMeetKeyProvider } from './ProtonMeetKeyProvider';

const liveKitMocks = vi.hoisted(() => {
    const onSetEncryptionKey = vi.fn();
    const importKey = vi.fn(async (key: ArrayBuffer) => ({ key }));

    class BaseKeyProvider {
        private readonly options: { keyringSize: number };
        private readonly keys: { key: unknown; keyIndex: number }[] = [];

        constructor(options: { keyringSize: number }) {
            this.options = options;
        }

        getOptions() {
            return this.options;
        }

        getKeys() {
            return this.keys;
        }

        onSetEncryptionKey(key: unknown, _participantIdentity: string | undefined, keyIndex: number) {
            onSetEncryptionKey(key, _participantIdentity, keyIndex);
            this.keys[keyIndex] = { key, keyIndex };
        }
    }

    return { BaseKeyProvider, importKey, onSetEncryptionKey };
});

vi.mock('livekit-client', () => liveKitMocks);

describe('ProtonMeetKeyProvider', () => {
    beforeEach(() => {
        liveKitMocks.importKey.mockClear();
        liveKitMocks.onSetEncryptionKey.mockClear();
    });

    it('skips installing the same epoch at the same keyring index twice', async () => {
        const keyProvider = new ProtonMeetKeyProvider();

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(false);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledWith(expect.anything(), undefined, 1);
    });

    it('deduplicates by epoch without retaining or comparing the raw key string', async () => {
        const keyProvider = new ProtonMeetKeyProvider();

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('YmFy', 1n)).resolves.toBe(false);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(1);
    });

    it('reinstalls when the epoch changes even if the keyring index wraps', async () => {
        const keyProvider = new ProtonMeetKeyProvider();

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('YmFy', 257n)).resolves.toBe(true);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenNthCalledWith(1, expect.anything(), undefined, 1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenNthCalledWith(2, expect.anything(), undefined, 1);
    });

    it('reuses installed material when switching back to a known active epoch', async () => {
        const keyProvider = new ProtonMeetKeyProvider();

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('YmFy', 2n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(false);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(3);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenNthCalledWith(3, expect.anything(), undefined, 1);
    });

    it('allows reinstallation after cleanup', async () => {
        const keyProvider = new ProtonMeetKeyProvider();

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        keyProvider.cleanCurrent();
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(2);
    });
});
