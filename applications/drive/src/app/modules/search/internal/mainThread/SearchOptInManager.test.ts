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
