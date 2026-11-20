import { locks } from 'node:worker_threads';

import { silentLogger } from '../testing/logger';
import { flush } from '../testing/settlement';
import { LeaderElection } from './LeaderElection';
import type { LeaderLock } from './LeaderLock';
import { TabChannel } from './TabChannel';
import { LeaderLock as WebLocksLeaderLock } from './weblock/LeaderLock';

const lockManager = locks as unknown as LockManager;

let userCounter = 0;

/** a lock whose loss the test triggers, as a lease that couldn't be renewed */
class LosableLock implements LeaderLock {
    acquisitions = 0;
    private lostListeners: (() => void)[] = [];

    async acquire() {
        this.acquisitions++;
        return true;
    }

    release() {}

    onLost(listener: () => void) {
        this.lostListeners.push(listener);
        return () => {
            this.lostListeners = this.lostListeners.filter((l) => {
                return l !== listener;
            });
        };
    }

    lose() {
        this.lostListeners.forEach((listener) => {
            listener();
        });
    }
}

describe('LeaderElection', () => {
    const started: LeaderElection[] = [];
    const channels: TabChannel[] = [];

    const openChannel = (userId: string) => {
        const channel = new TabChannel(new BroadcastChannel(`content-search:${userId}`));
        channels.push(channel);
        return channel;
    };

    /** one tab per app version given, or `count` tabs of the same version */
    const openTabs = (countOrVersions: number | string[], userId = `leader-election-${userCounter++}`) => {
        const versions =
            typeof countOrVersions === 'number' ? Array<string>(countOrVersions).fill('5.0.1.0') : countOrVersions;
        return versions.map((version) => {
            const election = new LeaderElection(
                new WebLocksLeaderLock(userId, lockManager),
                openChannel(userId),
                version,
                silentLogger
            );
            started.push(election);
            const changes: boolean[] = [];
            election.onLeadershipChanged((isLeader) => {
                changes.push(isLeader);
            });
            return { election, changes };
        });
    };

    afterEach(() => {
        started.splice(0).forEach((election) => {
            election.stop();
        });
        channels.splice(0).forEach((channel) => {
            channel.close();
        });
    });

    it('makes the first tab the leader', async () => {
        const [first, second] = openTabs(2);

        first.election.start();
        await flush();
        second.election.start();
        await flush();

        expect(first.election.isLeader).toBe(true);
        expect(first.changes).toEqual([true]);
        expect(second.election.isLeader).toBe(false);
        expect(second.changes).toEqual([]);
    });

    it('hands leadership to the next tab when the leader stops', async () => {
        const [first, second] = openTabs(2);
        first.election.start();
        await flush();
        second.election.start();
        await flush();

        first.election.stop();
        await flush();

        expect(first.election.isLeader).toBe(false);
        expect(second.election.isLeader).toBe(true);
        expect(second.changes).toEqual([true]);
    });

    it('reports losing leadership when stopped', async () => {
        const [first] = openTabs(1);
        first.election.start();
        await flush();

        first.election.stop();
        await flush();

        expect(first.changes).toEqual([true, false]);
    });

    it('leads again once started after it stopped', async () => {
        const [first, second] = openTabs(2);
        first.election.start();
        await flush();
        first.election.stop();
        await flush();

        second.election.start();
        await flush();
        first.election.start();
        await flush();

        expect(second.election.isLeader).toBe(true);
        expect(first.election.isLeader).toBe(false);

        second.election.stop();
        await flush();

        expect(first.election.isLeader).toBe(true);
        expect(first.changes).toEqual([true, false, true]);
    });

    it('hands leadership over when the leader steps down', async () => {
        const [first, second] = openTabs(2);
        first.election.start();
        await flush();
        second.election.start();
        await flush();

        first.election.stepDown();
        await flush();

        expect(first.election.isLeader).toBe(false);
        expect(first.changes).toEqual([true, false]);
        expect(second.election.isLeader).toBe(true);
    });

    it('never makes a tab that stepped down the leader again', async () => {
        const [first, second, third] = openTabs(3);
        first.election.start();
        await flush();
        second.election.start();
        await flush();
        third.election.start();
        await flush();

        second.election.stepDown();
        first.election.stop();
        await flush();

        expect(second.election.isLeader).toBe(false);
        expect(third.election.isLeader).toBe(true);

        third.election.stop();
        await flush();

        expect(second.election.isLeader).toBe(false);
        expect(second.changes).toEqual([]);
    });

    it('takes part again once restarted after stepping down', async () => {
        const [first] = openTabs(1);
        first.election.start();
        await flush();
        first.election.stepDown();

        first.election.stop();
        first.election.start();
        await flush();

        expect(first.election.isLeader).toBe(true);
    });

    it('does nothing when started while it runs', async () => {
        const lock = new LosableLock();
        const election = new LeaderElection(
            lock,
            openChannel(`leader-election-${userCounter++}`),
            '5.0.1.0',
            silentLogger
        );
        started.push(election);
        election.start();
        await flush();

        election.start();
        await flush();

        expect(lock.acquisitions).toBe(1);
    });

    it('does not lead with a lock granted to a run it stopped since', async () => {
        const grants: ((acquired: boolean) => void)[] = [];
        const lock: LeaderLock = {
            acquire: () => {
                return new Promise<boolean>((resolve) => {
                    grants.push(resolve);
                });
            },
            release: () => {},
            onLost: () => {
                return () => {};
            },
        };
        const election = new LeaderElection(
            lock,
            openChannel(`leader-election-${userCounter++}`),
            '5.0.1.0',
            silentLogger
        );
        started.push(election);
        election.start();
        election.stop();
        election.start();

        grants[0](true);
        await flush();

        expect(election.isLeader).toBe(false);

        grants[1](true);
        await flush();

        expect(election.isLeader).toBe(true);
    });

    it('logs joining, gaining, losing and leaving leadership', async () => {
        const lock = new LosableLock();
        const lines: string[] = [];
        const log = (message: string) => {
            lines.push(message);
        };
        const election = new LeaderElection(lock, openChannel(`leader-election-${userCounter++}`), '5.0.1.0', {
            ...silentLogger,
            info: log,
            warn: log,
        });
        started.push(election);
        election.start();
        await flush();

        lock.lose();
        await flush();
        election.stop();

        expect(lines).toEqual([
            'joining the leader election',
            'this tab is now the leader',
            'lost the leader lock, asking for it again',
            'this tab is no longer the leader',
            'this tab is now the leader',
            'leaving the leader election',
            'this tab is no longer the leader',
        ]);
    });

    it('reports a lost lock and asks for it again', async () => {
        const lock = new LosableLock();
        const election = new LeaderElection(
            lock,
            openChannel(`leader-election-${userCounter++}`),
            '5.0.1.0',
            silentLogger
        );
        started.push(election);
        const changes: boolean[] = [];
        election.onLeadershipChanged((isLeader) => {
            changes.push(isLeader);
        });
        election.start();
        await flush();

        lock.lose();
        await flush();

        expect(changes).toEqual([true, false, true]);
        expect(lock.acquisitions).toBe(2);
        expect(election.isLeader).toBe(true);
    });

    describe('version handover', () => {
        it('has an old leader hand over to a tab of a newer version', async () => {
            const [old, newer] = openTabs(['5.0.1.0', '5.0.2.0']);
            old.election.start();
            await flush();

            newer.election.start();
            await flush();

            expect(old.election.isLeader).toBe(false);
            expect(old.changes).toEqual([true, false]);
            expect(newer.election.isLeader).toBe(true);
        });

        it('ends up with the newer tab leading, of two old tabs and one new', async () => {
            const [old1, old2, newer] = openTabs(['5.0.1.0', '5.0.1.0', '5.0.2.0']);
            old1.election.start();
            await flush();
            old2.election.start();
            await flush();

            newer.election.start();
            await flush();

            expect(old1.election.isLeader).toBe(false);
            // the second old tab may lead for a moment, granted the lock before it heard of the newer version
            expect(old2.election.isLeader).toBe(false);
            expect(newer.election.isLeader).toBe(true);
        });

        it('never makes an old tab that starts after a newer one the leader', async () => {
            const [newer, old] = openTabs(['5.0.2.0', '5.0.1.0']);
            newer.election.start();
            await flush();
            old.election.start();
            await flush();

            newer.election.stop();
            await flush();

            expect(old.election.isLeader).toBe(false);
            expect(old.changes).toEqual([]);
        });

        it('has an old tab that is restarted learn of the newer one again', async () => {
            const [newer, old] = openTabs(['5.0.2.0', '5.0.1.0']);
            newer.election.start();
            await flush();
            old.election.start();
            await flush();

            old.election.stop();
            old.election.start();
            await flush();
            newer.election.stop();
            await flush();

            expect(old.election.isLeader).toBe(false);
        });

        it('keeps the leader when a tab of the same version starts', async () => {
            const [first, second] = openTabs(['5.0.2.0', '5.0.2.0']);
            first.election.start();
            await flush();

            second.election.start();
            await flush();

            expect(first.election.isLeader).toBe(true);
            expect(second.election.isLeader).toBe(false);
        });
    });
});
