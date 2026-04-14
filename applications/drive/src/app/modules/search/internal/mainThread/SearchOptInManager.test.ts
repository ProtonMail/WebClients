import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type { UserId } from '../shared/types';
import { FakeBroadcastChannel } from '../testing/FakeBroadcastChannel';
import { SearchOptInManager } from './SearchOptInManager';

global.BroadcastChannel = FakeBroadcastChannel as unknown as typeof BroadcastChannel;

jest.mock('../shared/Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn(), listenForWorkerLogs: jest.fn() },
}));

const USER_ID = 'test-user' as UserId;

beforeEach(() => {
    indexedDB = new IDBFactory();
    FakeBroadcastChannel.reset();
});

/** Create a legacy encrypted-search DB to simulate a user who previously opted in. */
async function createLegacyESDB(userId: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(`ES:${userId}:DB`, 1);
        request.onsuccess = () => {
            request.result.close();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

describe('SearchOptInManager', () => {
    describe('isOptedIn', () => {
        it('returns false by default', async () => {
            const manager = new SearchOptInManager(USER_ID);
            expect(await manager.isOptedIn()).toBe(false);
            manager.dispose();
        });

        it('returns true after optIn', async () => {
            const manager = new SearchOptInManager(USER_ID);
            await manager.optIn();
            expect(await manager.isOptedIn()).toBe(true);
            manager.dispose();
        });
    });

    describe('legacy encrypted-search auto-opt-in', () => {
        it('auto-opts in when legacy ES database exists', async () => {
            await createLegacyESDB(USER_ID);

            const manager = new SearchOptInManager(USER_ID);
            expect(await manager.isOptedIn()).toBe(true);
            manager.dispose();
        });

        it('persists opt-in so legacy check is not needed on next load', async () => {
            await createLegacyESDB(USER_ID);

            const manager1 = new SearchOptInManager(USER_ID);
            expect(await manager1.isOptedIn()).toBe(true);
            manager1.dispose();

            // Delete the legacy DB — opt-in should still be persisted in the new DB.
            await new Promise<void>((resolve) => {
                const request = indexedDB.deleteDatabase(`ES:${USER_ID}:DB`);
                request.onsuccess = () => resolve();
            });

            const manager2 = new SearchOptInManager(USER_ID);
            expect(await manager2.isOptedIn()).toBe(true);
            manager2.dispose();
        });

        it('does not auto-opt in when no legacy DB exists', async () => {
            const manager = new SearchOptInManager(USER_ID);
            expect(await manager.isOptedIn()).toBe(false);
            manager.dispose();
        });

        it('skips legacy check when already opted in', async () => {
            const manager = new SearchOptInManager(USER_ID);
            await manager.optIn();

            const databasesSpy = jest.spyOn(indexedDB, 'databases');
            expect(await manager.isOptedIn()).toBe(true);
            expect(databasesSpy).not.toHaveBeenCalled();

            databasesSpy.mockRestore();
            manager.dispose();
        });

        it('broadcasts opt-in when auto-migrating from legacy DB', async () => {
            await createLegacyESDB(USER_ID);

            const stateChannel = createSearchModuleStateUpdateChannel(USER_ID);
            const listener = jest.fn();
            stateChannel.onmessage = (ev) => listener(ev.data);

            const manager = new SearchOptInManager(USER_ID);
            await manager.isOptedIn();

            expect(listener).toHaveBeenCalledWith({ isUserOptIn: true });

            manager.dispose();
            stateChannel.close();
        });
    });

    describe('DB persistence', () => {
        it('opt-in survives a new manager instance', async () => {
            const manager1 = new SearchOptInManager(USER_ID);
            expect(await manager1.isOptedIn()).toBe(false);
            await manager1.optIn();
            expect(await manager1.isOptedIn()).toBe(true);
            manager1.dispose();

            const manager2 = new SearchOptInManager(USER_ID);
            expect(await manager2.isOptedIn()).toBe(true);
            manager2.dispose();
        });

        it('opt-in is stored per user', async () => {
            const manager1 = new SearchOptInManager(USER_ID);
            expect(await manager1.isOptedIn()).toBe(false);
            await manager1.optIn();
            expect(await manager1.isOptedIn()).toBe(true);
            manager1.dispose();

            const manager2 = new SearchOptInManager('other-user' as UserId);
            expect(await manager2.isOptedIn()).toBe(false);
            manager2.dispose();
        });
    });

    describe('cross-tab broadcast via state update channel', () => {
        it('optIn broadcasts { isUserOptIn: true } on the state update channel', async () => {
            const manager = new SearchOptInManager(USER_ID);
            const stateChannel = createSearchModuleStateUpdateChannel(USER_ID);
            const listener = jest.fn();
            stateChannel.onmessage = (ev) => listener(ev.data);

            await manager.optIn();

            expect(listener).toHaveBeenCalledWith({ isUserOptIn: true });

            manager.dispose();
            stateChannel.close();
        });

        it('does not broadcast to channels for different users', async () => {
            const manager = new SearchOptInManager(USER_ID);
            const otherChannel = createSearchModuleStateUpdateChannel('other-user' as UserId);
            const listener = jest.fn();
            otherChannel.onmessage = (ev) => listener(ev.data);

            await manager.optIn();

            expect(listener).not.toHaveBeenCalled();

            manager.dispose();
            otherChannel.close();
        });
    });
});
