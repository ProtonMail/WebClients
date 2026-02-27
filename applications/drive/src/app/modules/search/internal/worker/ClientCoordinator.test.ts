import type { ClientId, UserId } from '../types';
import { ClientCoordinator } from './ClientCoordinator';
import type { MainThreadBridge } from './indexing/types';

jest.mock('../Logger', () => ({
    Logger: { info: jest.fn(), error: jest.fn() },
}));

// Helpers to cast branded types in tests without polluting every call site.
const clientId = (id: string) => id as ClientId;
const userId = (id: string) => id as UserId;
const FakeBridge = () => ({}) as MainThreadBridge;

const CLIENT_1 = clientId('client-1');
const CLIENT_2 = clientId('client-2');
const USER_1 = userId('user-1');

// Heartbeat timeout and cleanup period from the implementation.
const HEARTBEAT_TIMEOUT = 30000;
const CLEANUP_PERIOD_MS = 3000;

describe('ClientCoordinator', () => {
    let coordinator: ClientCoordinator;

    beforeEach(() => {
        jest.useFakeTimers();
        coordinator = new ClientCoordinator();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('register()', () => {
        it('sets the first registered client as active', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('does not replace the active client when a second client registers', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('notifies subscribers when the first client becomes active', () => {
            const listener = jest.fn();
            coordinator.subscribeClientChanged(listener);

            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ clientId: CLIENT_1 }));
        });

        it('does not notify subscribers when a second client registers', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            const listener = jest.fn();
            coordinator.subscribeClientChanged(listener);

            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            expect(listener).not.toHaveBeenCalled();
        });

        it('starts the cleanup interval only once regardless of how many clients register', () => {
            const setIntervalSpy = jest.spyOn(self, 'setInterval');

            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('heartbeat()', () => {
        it('does nothing for an unknown client', () => {
            expect(() => coordinator.heartbeat(clientId('unknown'))).not.toThrow();
        });

        it('keeps a client alive past the timeout when heartbeats are sent', () => {
            jest.setSystemTime(0);
            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            // Would expire at 30s from registration; heartbeat resets the clock.
            jest.setSystemTime(HEARTBEAT_TIMEOUT - 1000);
            coordinator.heartbeat(CLIENT_1);

            // Advance past the original deadline — client was refreshed so it should survive.
            jest.setSystemTime(HEARTBEAT_TIMEOUT + 1000);
            jest.advanceTimersByTime(CLEANUP_PERIOD_MS);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });
    });

    describe('disconnect()', () => {
        it('sets the active client to null when the only client disconnects', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBeNull();
        });

        it('elects the next client when the active one disconnects', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_2);
        });

        it('notifies subscribers when the active client is replaced', () => {
            const listener = jest.fn();
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.register(USER_1, CLIENT_2, FakeBridge());
            coordinator.subscribeClientChanged(listener);

            coordinator.disconnect(CLIENT_1);

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ clientId: CLIENT_2 }));
        });

        it('notifies subscribers with null when the last client disconnects', () => {
            const listener = jest.fn();
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.subscribeClientChanged(listener);

            coordinator.disconnect(CLIENT_1);

            expect(listener).toHaveBeenCalledWith(null);
        });

        it('does not change the active client when a non-active client disconnects', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            coordinator.disconnect(CLIENT_2);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('restarts the cleanup interval after all clients disconnect and a new one registers', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());
            coordinator.disconnect(CLIENT_1);

            const setIntervalSpy = jest.spyOn(self, 'setInterval');
            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('subscribeClientChanged()', () => {
        it('returns an unsubscribe function that prevents future notifications', () => {
            const listener = jest.fn();
            const unsubscribe = coordinator.subscribeClientChanged(listener);
            unsubscribe();

            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('dead client cleanup', () => {
        it('disconnects a client that has not sent a heartbeat within the timeout', () => {
            jest.setSystemTime(0);
            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            jest.setSystemTime(HEARTBEAT_TIMEOUT + 1);
            jest.advanceTimersByTime(CLEANUP_PERIOD_MS);

            expect(coordinator.getActiveClientId()).toBeNull();
        });

        it('elects the next client when the active one times out', () => {
            jest.setSystemTime(0);
            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            jest.setSystemTime(1000);
            coordinator.register(USER_1, CLIENT_2, FakeBridge());

            // CLIENT_1 expires; CLIENT_2 gets a heartbeat so it survives.
            jest.setSystemTime(HEARTBEAT_TIMEOUT + 1);
            coordinator.heartbeat(CLIENT_2);
            jest.advanceTimersByTime(CLEANUP_PERIOD_MS);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_2);
        });

        it('keeps a client that is still within the heartbeat window', () => {
            coordinator.register(USER_1, CLIENT_1, FakeBridge());

            // Advance to just before the timeout — cleanup runs but the client is not yet stale.
            jest.advanceTimersByTime(HEARTBEAT_TIMEOUT - 1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });
    });
});
