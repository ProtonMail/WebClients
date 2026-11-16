import { trackPendingAction, waitForPendingActions } from '../../lib/eventNotifier/pendingActions';

const createDeferred = () => {
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const isSettled = async (promise: Promise<unknown>) => {
    let settled = false;
    void promise.then(() => {
        settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    return settled;
};

describe('pendingActions', () => {
    it('should resolve immediately when no action is pending', async () => {
        expect(await isSettled(waitForPendingActions())).toBe(true);
    });

    it('should return the tracked promise', () => {
        const promise = Promise.resolve('result');
        expect(trackPendingAction(promise)).toBe(promise);
    });

    it('should wait for every pending action to settle', async () => {
        const first = createDeferred();
        const second = createDeferred();
        trackPendingAction(first.promise);
        trackPendingAction(second.promise);

        const wait = waitForPendingActions();
        first.resolve();
        expect(await isSettled(wait)).toBe(false);

        second.resolve();
        expect(await isSettled(wait)).toBe(true);
    });

    it('should resolve when an action rejects', async () => {
        const action = createDeferred();
        const tracked = trackPendingAction(action.promise);
        const caught = tracked.catch((error: Error) => error.message);

        const wait = waitForPendingActions();
        action.reject(new Error('failed'));

        expect(await isSettled(wait)).toBe(true);
        expect(await caught).toBe('failed');
    });

    it('should not resolve on the first rejection while other actions are pending', async () => {
        const failing = createDeferred();
        const pending = createDeferred();
        trackPendingAction(failing.promise).catch(() => {});
        trackPendingAction(pending.promise);

        const wait = waitForPendingActions();
        failing.reject(new Error('failed'));
        expect(await isSettled(wait)).toBe(false);

        pending.resolve();
        expect(await isSettled(wait)).toBe(true);
    });

    it('should wait for actions started while waiting', async () => {
        const first = createDeferred();
        const second = createDeferred();
        trackPendingAction(first.promise);

        const wait = waitForPendingActions();
        trackPendingAction(second.promise);
        first.resolve();
        expect(await isSettled(wait)).toBe(false);

        second.resolve();
        expect(await isSettled(wait)).toBe(true);
    });
});
