import { OnlineMonitor } from './OnlineMonitor';

jest.mock('../../shared/Logger');

const setNavigatorOnLine = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true });
};

const fireOnline = () => self.dispatchEvent(new Event('online'));
const fireOffline = () => self.dispatchEvent(new Event('offline'));

describe('OnlineMonitor', () => {
    afterEach(() => {
        setNavigatorOnLine(true);
    });

    describe('initial state', () => {
        it('starts online when navigator.onLine is true', () => {
            setNavigatorOnLine(true);
            const monitor = new OnlineMonitor();
            expect(monitor.isOnline()).toBe(true);
        });

        it('starts offline when navigator.onLine is false', () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();
            expect(monitor.isOnline()).toBe(false);
        });
    });

    describe('waitForOnline', () => {
        it('resolves immediately when already online', async () => {
            setNavigatorOnLine(true);
            const monitor = new OnlineMonitor();
            await expect(monitor.waitForOnline()).resolves.toBeUndefined();
        });

        it('parks when offline and resolves once an online event fires', async () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();

            let settled = false;
            const waitPromise = monitor.waitForOnline().then(() => {
                settled = true;
            });

            // Flush microtasks - the promise should still be pending.
            await Promise.resolve();
            expect(settled).toBe(false);

            fireOnline();
            await waitPromise;
            expect(settled).toBe(true);
            expect(monitor.isOnline()).toBe(true);
        });

        it('resolves all concurrent waiters on a single online event', async () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();

            const waiters = [monitor.waitForOnline(), monitor.waitForOnline(), monitor.waitForOnline()];
            fireOnline();

            await expect(Promise.all(waiters)).resolves.toEqual([undefined, undefined, undefined]);
        });
    });

    describe('cancelWaits', () => {
        it('resolves pending waiters without flipping online state', async () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();

            const waitPromise = monitor.waitForOnline();
            monitor.cancelWaits();

            await expect(waitPromise).resolves.toBeUndefined();
            expect(monitor.isOnline()).toBe(false);
        });

        it('is a no-op when there are no waiters', () => {
            setNavigatorOnLine(true);
            const monitor = new OnlineMonitor();
            expect(() => monitor.cancelWaits()).not.toThrow();
            expect(monitor.isOnline()).toBe(true);
        });

        it('does not resolve waiters added after cancelWaits', async () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();

            monitor.cancelWaits();

            let settled = false;
            void monitor.waitForOnline().then(() => {
                settled = true;
            });
            await Promise.resolve();
            expect(settled).toBe(false);
        });
    });

    describe('navigator events', () => {
        it("'online' event flips state from offline to online", () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();
            expect(monitor.isOnline()).toBe(false);

            fireOnline();
            expect(monitor.isOnline()).toBe(true);
        });

        it("'offline' event flips state from online to offline", () => {
            setNavigatorOnLine(true);
            const monitor = new OnlineMonitor();
            expect(monitor.isOnline()).toBe(true);

            fireOffline();
            expect(monitor.isOnline()).toBe(false);
        });

        it("'online' event when already online is a no-op", async () => {
            setNavigatorOnLine(true);
            const monitor = new OnlineMonitor();

            // Adding a waiter while already online resolves immediately, so no chance to observe a flip.
            // Just confirm state stays online and a fresh wait still resolves.
            fireOnline();
            expect(monitor.isOnline()).toBe(true);
            await expect(monitor.waitForOnline()).resolves.toBeUndefined();
        });

        it("'offline' event when already offline is a no-op", () => {
            setNavigatorOnLine(false);
            const monitor = new OnlineMonitor();

            fireOffline();
            expect(monitor.isOnline()).toBe(false);
        });

        it('toggling offline → online → offline parks subsequent waiters', async () => {
            setNavigatorOnLine(true);
            const monitor = new OnlineMonitor();

            fireOffline();
            expect(monitor.isOnline()).toBe(false);

            fireOnline();
            expect(monitor.isOnline()).toBe(true);

            fireOffline();
            expect(monitor.isOnline()).toBe(false);

            let settled = false;
            void monitor.waitForOnline().then(() => {
                settled = true;
            });
            await Promise.resolve();
            expect(settled).toBe(false);

            fireOnline();
            await Promise.resolve();
            expect(settled).toBe(true);
        });
    });
});
