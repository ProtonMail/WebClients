import type { DatabaseLock } from '../db/DatabaseLock';
import type { Logger } from '../utils/logger';
import type { ChannelTransport } from './ChannelTransport';
import type { LeaderLock } from './LeaderLock';
import { TabLocalDatabaseLock } from './TabLocalDatabaseLock';
import { ChannelTransport as SingleTabChannelTransport } from './singleTab/ChannelTransport';
import { LeaderLock as SingleTabLeaderLock } from './singleTab/LeaderLock';
import { DatabaseLock as WebLocksDatabaseLock } from './weblock/DatabaseLock';
import { LeaderLock as WebLocksLeaderLock } from './weblock/LeaderLock';

/** What the content search tabs of one user coordinate with, implemented with what the browser has. */
export interface TabCoordination {
    leaderLock: LeaderLock;
    /** shared with the other tabs, so a search in any tab interrupts indexing */
    dbLock: DatabaseLock;
    transport: ChannelTransport;
}

/**
 * The one place that picks the implementations. Without Web Locks or BroadcastChannel (Safari below 15.4), the
 * tab works alone, as before tabs shared the index: content search assumes 15.4, but the app still loads there.
 */
export function createTabCoordination({
    userId,
    logger,
    // eslint-disable-next-line compat/compat -- checked below, content search requires Safari 15.4+
    locks = navigator.locks,
}: {
    userId: string;
    /** tells the tabs apart, as they all write to the same logs */
    logger: Logger;
    locks?: LockManager | undefined;
}): TabCoordination {
    if (!locks || typeof BroadcastChannel === 'undefined') {
        return {
            leaderLock: new SingleTabLeaderLock(),
            dbLock: new TabLocalDatabaseLock(),
            transport: new SingleTabChannelTransport(),
        };
    }
    return {
        leaderLock: new WebLocksLeaderLock(userId, locks),
        dbLock: new WebLocksDatabaseLock(userId, logger, locks),
        // eslint-disable-next-line compat/compat -- checked above, content search requires Safari 15.4+
        transport: new BroadcastChannel(`content-search:${userId}`),
    };
}
