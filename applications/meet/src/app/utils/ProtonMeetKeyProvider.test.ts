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

const importedKey = (base64Key: string) => ({ key: Uint8Array.fromBase64(base64Key).buffer });

describe('ProtonMeetKeyProvider', () => {
    beforeEach(() => {
        liveKitMocks.importKey.mockClear();
        liveKitMocks.onSetEncryptionKey.mockClear();
    });

    it('skips installing the same epoch at the same keyring index twice', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(false);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledWith(expect.anything(), undefined, 1);
    });

    it('deduplicates by epoch without retaining or comparing the raw key string', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('YmFy', 1n)).resolves.toBe(false);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(1);
    });

    it('reinstalls when the epoch changes even if the keyring index wraps', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('YmFy', 257n)).resolves.toBe(true);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenNthCalledWith(1, expect.anything(), undefined, 1);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenNthCalledWith(2, expect.anything(), undefined, 1);
    });

    it('reuses installed material when switching back to a known active epoch', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('YmFy', 2n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(false);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(3);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenNthCalledWith(3, expect.anything(), undefined, 1);
    });

    it('allows reinstallation after cleanup', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);
        keyProvider.cleanCurrent();
        await expect(keyProvider.setKeyWithEpoch('Zm9v', 1n)).resolves.toBe(true);

        expect(liveKitMocks.importKey).toHaveBeenCalledTimes(2);
        expect(liveKitMocks.onSetEncryptionKey).toHaveBeenCalledTimes(2);
    });

    it('exposes only the active epoch key to LiveKit', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await keyProvider.setKeyWithEpoch('Zm9v', 1n);
        await keyProvider.setKeyWithEpoch('YmFy', 2n);

        expect(keyProvider.getKeys()).toStrictEqual([{ key: importedKey('YmFy'), keyIndex: 2 }]);
    });

    it('exposes the known epoch key again after switching back to it', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await keyProvider.setKeyWithEpoch('Zm9v', 1n);
        await keyProvider.setKeyWithEpoch('YmFy', 2n);
        await keyProvider.setKeyWithEpoch('Zm9v', 1n);

        expect(keyProvider.getKeys()).toStrictEqual([{ key: importedKey('Zm9v'), keyIndex: 1 }]);
    });

    it('exposes no key to LiveKit after cleanup', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await keyProvider.setKeyWithEpoch('Zm9v', 1n);
        await keyProvider.setKeyWithEpoch('YmFy', 2n);
        keyProvider.cleanCurrent();

        expect(keyProvider.getKeys()).toEqual([]);
    });

    it('lists every installed keyring index in the keychain information', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: true });

        await keyProvider.setKeyWithEpoch('Zm9v', 1n);
        await keyProvider.setKeyWithEpoch('YmFy', 2n);

        expect(keyProvider.getKeychainIndexInformation()).toEqual([1, 2]);
        expect(keyProvider.getKeys()).toHaveLength(1);
    });

    it('exposes every installed key to LiveKit when replaying only the active key is off', async () => {
        const keyProvider = new ProtonMeetKeyProvider({ replayOnlyActiveKey: false });

        await keyProvider.setKeyWithEpoch('Zm9v', 1n);
        await keyProvider.setKeyWithEpoch('YmFy', 2n);

        expect(
            keyProvider
                .getKeys()
                .filter(Boolean)
                .map(({ keyIndex }) => keyIndex)
        ).toEqual([1, 2]);
    });
});
