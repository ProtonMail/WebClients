import { locks } from 'node:worker_threads';

import { flush, track } from '../../testing/settlement';
import { LeaderLock } from './LeaderLock';

const lockManager = locks as unknown as LockManager;

let userCounter = 0;

const openTabs = (count: number) => {
    const userId = `web-locks-leader-lock-${userCounter++}`;
    return Array.from({ length: count }, () => {
        return new LeaderLock(userId, lockManager);
    });
};

describe('Web Locks LeaderLock', () => {
    it('is acquired at once when no tab holds it', async () => {
        const [tab] = openTabs(1);

        const acquired = track(tab.acquire());
        await flush();

        expect(acquired.state.settled).toBe(true);
        expect(await acquired.done).toBe(true);
    });

    it('is acquired once the tab that holds it releases it', async () => {
        const [leader, follower] = openTabs(2);
        await leader.acquire();

        const acquired = track(follower.acquire());
        await flush();

        expect(acquired.state.settled).toBe(false);

        leader.release();
        await flush();

        expect(await acquired.done).toBe(true);
    });

    it('goes to the next tab in line when released', async () => {
        const [leader, second, third] = openTabs(3);
        await leader.acquire();
        const secondAcquired = track(second.acquire());
        await flush();
        const thirdAcquired = track(third.acquire());
        await flush();

        leader.release();
        await flush();

        expect(secondAcquired.state.settled).toBe(true);
        expect(thirdAcquired.state.settled).toBe(false);

        second.release();
        await flush();

        expect(thirdAcquired.state.settled).toBe(true);
    });

    it('gives up its place in line when released before it is acquired', async () => {
        const [leader, quitter, third] = openTabs(3);
        await leader.acquire();
        const quitterAcquired = track(quitter.acquire());
        await flush();
        const thirdAcquired = track(third.acquire());
        await flush();

        quitter.release();
        await flush();

        expect(await quitterAcquired.done).toBe(false);

        leader.release();
        await flush();

        expect(await thirdAcquired.done).toBe(true);
    });

    it('can be acquired again after it was released', async () => {
        const [tab] = openTabs(1);
        await tab.acquire();
        tab.release();

        const acquired = track(tab.acquire());
        await flush();

        expect(await acquired.done).toBe(true);
    });
});
