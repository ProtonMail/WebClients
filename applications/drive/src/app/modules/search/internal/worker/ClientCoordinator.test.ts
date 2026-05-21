import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { sendErrorReportForSearch } from '../shared/errors';
import { searchMetrics } from '../shared/searchMetrics';
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
        coordinator = new ClientCoordinator(() => searchMetrics);
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
            coordinator.heartbeat(CLIENT_1, false);

            // Advance past original timeout
            jest.advanceTimersByTime(CLEANUP_PERIOD_MS + 1000);
            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
        });

        it('reports isClientRegistered=true for a known client', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE);
            expect(coordinator.heartbeat(CLIENT_1, false)).toEqual({ isClientRegistered: true });
        });

        it('reports isClientRegistered=false for an unknown client so the caller can re-register', () => {
            expect(coordinator.heartbeat('unknown' as ClientId, false)).toEqual({ isClientRegistered: false });
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

    describe('election strategy', () => {
        const CLIENT_3 = 'client-3' as ClientId;

        it('prefers the last-foreground client over the freshest', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE); // becomes active
            coordinator.register(USER_1, CLIENT_2, BRIDGE);
            coordinator.register(USER_1, CLIENT_3, BRIDGE);

            // CLIENT_2 was focused at some point; CLIENT_3 keeps heartbeating but in background.
            coordinator.heartbeat(CLIENT_2, true);
            jest.advanceTimersByTime(1000);
            coordinator.heartbeat(CLIENT_3, false);

            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_2);
        });

        it('falls back to the freshest client when no foreground was ever recorded', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE); // becomes active
            coordinator.register(USER_1, CLIENT_2, BRIDGE);
            coordinator.register(USER_1, CLIENT_3, BRIDGE);

            // No isForeground=true heartbeat ever. CLIENT_3 is the most recent to ping.
            jest.advanceTimersByTime(1000);
            coordinator.heartbeat(CLIENT_2, false);
            jest.advanceTimersByTime(1000);
            coordinator.heartbeat(CLIENT_3, false);

            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_3);
        });

        it('falls back to freshest when the last-foreground client itself disconnected', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE); // becomes active
            coordinator.register(USER_1, CLIENT_2, BRIDGE);
            coordinator.register(USER_1, CLIENT_3, BRIDGE);

            // CLIENT_2 was the foreground, but it leaves before the active does.
            coordinator.heartbeat(CLIENT_2, true);
            jest.advanceTimersByTime(1000);
            coordinator.heartbeat(CLIENT_3, false);
            coordinator.disconnect(CLIENT_2);

            coordinator.disconnect(CLIENT_1);

            // CLIENT_3 wins as the freshest remaining client.
            expect(coordinator.getActiveClientId()).toBe(CLIENT_3);
        });

        it('keeps the foreground preference sticky across a background flip', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE); // becomes active
            coordinator.register(USER_1, CLIENT_2, BRIDGE);
            coordinator.register(USER_1, CLIENT_3, BRIDGE);

            // CLIENT_2 was focused, then user tabbed away — but it remains our best guess.
            coordinator.heartbeat(CLIENT_2, true);
            jest.advanceTimersByTime(1000);
            coordinator.heartbeat(CLIENT_2, false);
            jest.advanceTimersByTime(1000);
            coordinator.heartbeat(CLIENT_3, false);

            coordinator.disconnect(CLIENT_1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_2);
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
        it('does not disconnect the active client even past the heartbeat timeout', () => {
            // The active client owns the searcher and is exempt from cleanup.
            coordinator.register(USER_1, CLIENT_1, BRIDGE);

            jest.advanceTimersByTime(HEARTBEAT_TIMEOUT + CLEANUP_PERIOD_MS + 1);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
            expect(sendErrorReportForSearch).not.toHaveBeenCalled();
        });

        it('disconnects an inactive client after heartbeat timeout', () => {
            coordinator.register(USER_1, CLIENT_1, BRIDGE); // becomes active
            coordinator.register(USER_1, CLIENT_2, BRIDGE); // passive

            // Keep the active client fresh; let CLIENT_2 fall stale.
            jest.advanceTimersByTime(HEARTBEAT_TIMEOUT - 1000);
            coordinator.heartbeat(CLIENT_1, false);

            jest.advanceTimersByTime(CLEANUP_PERIOD_MS + 1000);

            expect(coordinator.getActiveClientId()).toBe(CLIENT_1);
            expect(sendErrorReportForSearch).toHaveBeenCalled();
        });
    });
});
