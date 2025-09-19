import * as TauriCommands from 'proton-authenticator/lib/tauri/commands';

import { createKeyringAdapter } from './adapter.keyring';
import { STORAGE_KEY_IDB_ID } from './constants';
import type { StorageKeyRef } from './types';
import { StorageKeySource } from './types';

jest.mock('proton-authenticator/lib/tauri/commands', () => ({
    commands: {
        getStorageKey: jest.fn(),
        generateStorageKey: jest.fn(),
    },
}));

const commands = TauriCommands.commands as jest.Mocked<typeof TauriCommands.commands>;

const createKeyRef = (overrides: Partial<StorageKeyRef> = {}): StorageKeyRef => ({
    id: STORAGE_KEY_IDB_ID,
    adapterKeyId: 'adapter::keyring::test123',
    salt: new Uint8Array(32).fill(1),
    source: StorageKeySource.KEYRING,
    ...overrides,
});

describe('KeyringAdapter', () => {
    let adapter: ReturnType<typeof createKeyringAdapter>;

    beforeEach(() => {
        jest.clearAllMocks();
        adapter = createKeyringAdapter();
        commands.getStorageKey.mockResolvedValue({ status: 'ok', data: 'base64-encoded-key' });
        commands.generateStorageKey.mockResolvedValue({ status: 'ok', data: 'base64-encoded-key' });
    });

    describe('legacy compatibility', () => {
        test('should use `adapterKeyId` when available', async () => {
            const keyRef = createKeyRef({ adapterKeyId: 'adapter::keyring::new-unique-id' });
            await adapter.read(keyRef);
            expect(commands.getStorageKey).toHaveBeenCalledWith('adapter::keyring::new-unique-id');
        });

        test('should fallback to `ref.id` when `adapterKeyId` is missing', async () => {
            const legacyKeyRef = createKeyRef({ adapterKeyId: undefined });
            await adapter.read(legacyKeyRef);
            expect(commands.getStorageKey).toHaveBeenCalledWith(STORAGE_KEY_IDB_ID);
        });

        test('should use `adapterKeyId` for generate operation', async () => {
            const adapterKeyId = 'adapter::keyring::generated-id';
            await adapter.generate(adapterKeyId);

            expect(commands.generateStorageKey).toHaveBeenCalledWith(adapterKeyId);
        });
    });
});
