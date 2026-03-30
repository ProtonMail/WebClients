import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { sendErrorReportForSearch } from '../shared/errors';
import type { ClientId, UserId } from '../shared/types';
import { ClientCoordinator } from './ClientCoordinator';

jest.mock('../shared/errors', () => ({
    sendErrorReportForSearch: jest.fn(),
}));

const HEARTBEAT_TIMEOUT = 300_000;
const CLEANUP_PERIOD_MS = 3000;

const USER_1 = 'user-1' as UserId;
const CLIENT_1 = 'client-1' as ClientId;
const CLIENT_2 = 'client-2' as ClientId;
const BRIDGE = {} as MainThreadBridge;

describe('ClientCoordinator', () => {
    let coordinator: ClientCoordinator;

    beforeEach(() => {
        jest.useFakeTimers();
        coordinator = new ClientCoordinator();
    });

    afterEach(() => {
        coordinator.dispose();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('register', () => {
        it('first client becomes active', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('second client does not replace active', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            coordinator.register(USER_1, CLIENT_2, BRIDGE);
            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('notifies subscribers on first registration', () => {
            const listener = jest.fn();
            coordinator.subscribeClientChanged(listener);
            coordinator.register(USER_1, CLIENT_1, BRIDGE);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ clientId: CLIENT_1 }));
        });

        it('re-registering the same clientId does not notify subscribers again', () => {
            const listener = jest.fn();
            coordinator.subscribeClientChanged(listener);
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            expect(listener).toHaveBeenCalledTimes(1);

            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('heartbeat', () => {
        it('keeps client alive past timeout', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);

            // Heartbeat just before timeout
            jest.advanceTimersByTime(HEARTBEAT_TIMEOUT - 1000);
            coordinator.heartbeat(CLIENT_1);

            // Advance past original timeout
            jest.advanceTimersByTime(CLEANUP_PERIOD_MS + 1000);
            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('is a no-op for unknown client', () => {
            expect(() => coordinator.heartbeat('unknown' as ClientId)).not.toThrow();
        });
    });

    describe('disconnect', () => {
        it('elects next client when active disconnects', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            coordinator.register(USER_1, CLIENT_2, BRIDGE);
            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_2);
        });

        it('sets active to null when last client disconnects', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBeNull();
        });

        it('notifies subscribers on election change', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            coordinator.register(USER_1, CLIENT_2, BRIDGE);

            const listener = jest.fn();
            coordinator.subscribeClientChanged(listener);
            coordinator.disconnect(CLIENT_1);

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ clientId: CLIENT_2 }));
        });
    });

    describe('subscribeClientChanged', () => {
        it('unsubscribe stops notifications', () => {
            const listener = jest.fn();
            const unsubscribe = coordinator.subscribeClientChanged(listener);
            unsubscribe();

            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('dead client cleanup', () => {
        it('disconnects client after heartbeat timeout', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);

            jest.advanceTimersByTime(HEARTBEAT_TIMEOUT + CLEANUP_PERIOD_MS + 1);
            expect(coordinator.getActiveClientId()).toBeNull();
            expect(sendErrorReportForSearch).toHaveBeenCalled();
        });

        it('elects next client when dead client was active', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            coordinator.register(USER_1, CLIENT_2, BRIDGE);

            // Keep CLIENT_2 alive
            jest.advanceTimersByTime(HEARTBEAT_TIMEOUT - 1000);
            coordinator.heartbeat(CLIENT_2);

            // CLIENT_1 times out
            jest.advanceTimersByTime(CLEANUP_PERIOD_MS + 1000);
            expect(coordinator.getActiveClientId()).toBe(CLIENT_2);
        });
    });
});
