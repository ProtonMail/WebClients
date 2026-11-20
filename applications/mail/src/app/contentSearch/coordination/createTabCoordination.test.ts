import { locks } from 'node:worker_threads';

import { silentLogger } from '../testing/logger';
import { flush, track } from '../testing/settlement';
import { TabLocalDatabaseLock } from './TabLocalDatabaseLock';
import { type TabCoordination, createTabCoordination } from './createTabCoordination';
import { ChannelTransport as SingleTabChannelTransport } from './singleTab/ChannelTransport';
import { LeaderLock as SingleTabLeaderLock } from './singleTab/LeaderLock';
import { DatabaseLock as WebLocksDatabaseLock } from './weblock/DatabaseLock';
import { LeaderLock as WebLocksLeaderLock } from './weblock/LeaderLock';

const lockManager = locks as unknown as LockManager;

let userCounter = 0;

describe('createTabCoordination', () => {
    const created: TabCoordination[] = [];

    const open = (userId: string, withLocks: LockManager | undefined) => {
        const coordination = createTabCoordination({ userId, logger: silentLogger, locks: withLocks });
        created.push(coordination);
        return coordination;
    };

    afterEach(() => {
        created.splice(0).forEach((coordination) => {
            coordination.leaderLock.release();
            coordination.transport.close();
        });
    });

    describe('with Web Locks', () => {
        it('picks the Web Locks locks and a BroadcastChannel', () => {
            const coordination = open(`tab-coordination-${userCounter++}`, lockManager);

            expect(coordination.leaderLock).toBeInstanceOf(WebLocksLeaderLock);
            expect(coordination.dbLock).toBeInstanceOf(WebLocksDatabaseLock);
            expect(coordination.transport).toBeInstanceOf(BroadcastChannel);
        });

        it('shares them between the tabs of a user', async () => {
            const userId = `tab-coordination-${userCounter++}`;
            const first = open(userId, lockManager);
            const second = open(userId, lockManager);
            const received: unknown[] = [];
            second.transport.addEventListener('message', (event) => {
                received.push(event.data);
            });

            await first.leaderLock.acquire();
            const secondAcquired = track(second.leaderLock.acquire());
            first.transport.postMessage('hello');
            await flush();

            expect(secondAcquired.state.settled).toBe(false);
            expect(received).toEqual(['hello']);
        });
    });

    describe('without Web Locks', () => {
        it('has the tab work alone, as before tabs shared the index', async () => {
            const coordination = open(`tab-coordination-${userCounter++}`, undefined);

            expect(coordination.leaderLock).toBeInstanceOf(SingleTabLeaderLock);
            expect(coordination.dbLock).toBeInstanceOf(TabLocalDatabaseLock);
            expect(coordination.transport).toBeInstanceOf(SingleTabChannelTransport);
            expect(await coordination.leaderLock.acquire()).toBe(true);
        });
    });
});
