import { locks } from 'node:worker_threads';

import type { OpenSearchDirectory } from '../coordination/OpenSearchDirectory';
import { TabChannel, type TabMessage } from '../coordination/TabChannel';
import { OpenSearchDirectory as WebLocksOpenSearchDirectory } from '../coordination/weblock/OpenSearchDirectory';
import { flush } from '../testing/settlement';
import { OpenSearchSubscriptions } from './OpenSearchSubscriptions';

const lockManager = locks as unknown as LockManager;

let userCounter = 0;

const makeListener = () => {
    return { onUpdates: vi.fn(), onMissedUpdates: vi.fn() };
};

describe('OpenSearchSubscriptions', () => {
    let subscriptions: OpenSearchSubscriptions;
    let channel: TabChannel;
    /** another tab of the same user, which sees what this one posts */
    let otherTab: TabChannel;
    let otherTabReceived: TabMessage[];
    let otherTabDirectory: OpenSearchDirectory;

    beforeEach(() => {
        const userId = `open-search-subscriptions-${userCounter++}`;
        channel = new TabChannel(new BroadcastChannel(`content-search:${userId}`));
        otherTab = new TabChannel(new BroadcastChannel(`content-search:${userId}`));
        otherTabReceived = [];
        otherTab.subscribe((message) => {
            otherTabReceived.push(message);
        });
        otherTabDirectory = new WebLocksOpenSearchDirectory(userId, lockManager);
        let idCounter = 0;
        subscriptions = new OpenSearchSubscriptions(
            channel,
            new WebLocksOpenSearchDirectory(userId, lockManager),
            () => {
                return `own-${idCounter++}`;
            }
        );
    });

    afterEach(() => {
        subscriptions.dispose();
        channel.close();
        otherTab.close();
    });

    it('lists its searches for every tab until unsubscribed', async () => {
        const unsubscribe = await subscriptions.subscribe('hello', makeListener());

        expect(await otherTabDirectory.list()).toEqual(new Map([['own-0', 'hello']]));
        expect(await subscriptions.list()).toEqual(new Map([['own-0', 'hello']]));

        unsubscribe();
        await flush();

        expect(await otherTabDirectory.list()).toEqual(new Map());
    });

    it('delivers what the leader posts for its own searches only', async () => {
        const listener = makeListener();
        await subscriptions.subscribe('hello', listener);

        otherTab.post({ type: 'expressionUpdates', searchId: 'own-0', matched: ['a'], unmatched: ['b'] });
        otherTab.post({ type: 'expressionUpdates', searchId: 'other', matched: ['c'], unmatched: [] });
        await flush();

        expect(listener.onUpdates.mock.calls).toEqual([[{ matched: ['a'], unmatched: ['b'], removed: [] }]]);
    });

    it('delivers deleted messages to every one of its searches', async () => {
        const first = makeListener();
        const second = makeListener();
        await subscriptions.subscribe('hello', first);
        await subscriptions.subscribe('world', second);

        otherTab.post({ type: 'messagesDeleted', ids: ['a'] });
        await flush();

        expect(first.onUpdates.mock.calls).toEqual([[{ matched: [], unmatched: [], removed: ['a'] }]]);
        expect(second.onUpdates.mock.calls).toEqual([[{ matched: [], unmatched: [], removed: ['a'] }]]);
    });

    it('delivers nothing once unsubscribed', async () => {
        const listener = makeListener();
        const unsubscribe = await subscriptions.subscribe('hello', listener);
        unsubscribe();

        otherTab.post({ type: 'expressionUpdates', searchId: 'own-0', matched: ['a'], unmatched: [] });
        otherTab.post({ type: 'messagesDeleted', ids: ['a'] });
        await flush();

        expect(listener.onUpdates).not.toHaveBeenCalled();
    });

    describe('in the leading tab', () => {
        it('delivers the matches of its own searches directly, and posts those of the other tabs', async () => {
            const listener = makeListener();
            await subscriptions.subscribe('hello', listener);

            subscriptions.reportMatches('own-0', { matched: ['a'], unmatched: ['b'] });
            subscriptions.reportMatches('other-0', { matched: ['c'], unmatched: [] });
            await flush();

            expect(listener.onUpdates.mock.calls).toEqual([[{ matched: ['a'], unmatched: ['b'], removed: [] }]]);
            expect(otherTabReceived).toEqual([
                { type: 'expressionUpdates', searchId: 'other-0', matched: ['c'], unmatched: [] },
            ]);
        });

        it('reports deleted messages to its own searches and to the other tabs', async () => {
            const listener = makeListener();
            await subscriptions.subscribe('hello', listener);

            subscriptions.reportDeleted([]);
            subscriptions.reportDeleted(['a', 'b']);
            await flush();

            expect(listener.onUpdates.mock.calls).toEqual([[{ matched: [], unmatched: [], removed: ['a', 'b'] }]]);
            expect(otherTabReceived).toEqual([{ type: 'messagesDeleted', ids: ['a', 'b'] }]);
        });
    });

    it('tells a search when the directory reports it may have missed updates', async () => {
        let reportMissed = () => {};
        const directory: OpenSearchDirectory = {
            open: async (_searchId, _expression, onMissedUpdates) => {
                reportMissed = onMissedUpdates;
                return () => {};
            },
            list: async () => {
                return new Map();
            },
        };
        const withDirectory = new OpenSearchSubscriptions(channel, directory);
        const listener = makeListener();
        await withDirectory.subscribe('hello', listener);

        reportMissed();

        expect(listener.onMissedUpdates).toHaveBeenCalledTimes(1);
        withDirectory.dispose();
    });
});
