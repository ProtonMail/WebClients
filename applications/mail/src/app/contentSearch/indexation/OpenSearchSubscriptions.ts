import getRandomString from '@proton/utils/getRandomString';

import type { OpenSearchDirectory } from '../coordination/OpenSearchDirectory';
import type { TabChannel, TabMessage } from '../coordination/TabChannel';

/**
 * What changed for an open search since it ran: of the messages the leader indexed, those its expression matches
 * and those it doesn't, whether or not they were among its results, and the messages that were deleted.
 */
export interface ExpressionUpdates {
    matched: string[];
    unmatched: string[];
    removed: string[];
}

export interface ExpressionUpdatesListener {
    onUpdates(updates: ExpressionUpdates): void;
    /** the leader may have stopped seeing the search for a while: its results may be stale, it has to run again */
    onMissedUpdates(): void;
}

/**
 * The open searches of this tab, listed in the {@link OpenSearchDirectory} so the leader's index worker sees them,
 * and what the leader finds for every tab's searches, routed to the right one: delivered directly when the search is
 * open in the leading tab, posted to the other tabs otherwise.
 */
export class OpenSearchSubscriptions {
    private readonly listeners = new Map<string, ExpressionUpdatesListener>();
    private readonly unsubscribeFromChannel: () => void;

    constructor(
        private readonly channel: TabChannel,
        private readonly directory: OpenSearchDirectory,
        /** never contains `:`, which the Web Locks `OpenSearchDirectory` uses in lock names */
        private readonly generateId: () => string = () => {
            return getRandomString(16);
        }
    ) {
        this.unsubscribeFromChannel = channel.subscribe((message) => {
            this.handleTabMessage(message);
        });
    }

    /** Resolves once the leader can see the search, with the unsubscribe. */
    async subscribe(expression: string, listener: ExpressionUpdatesListener): Promise<() => void> {
        const searchId = this.generateId();
        this.listeners.set(searchId, listener);
        let close: () => void;
        try {
            close = await this.directory.open(searchId, expression, () => {
                this.listeners.get(searchId)?.onMissedUpdates();
            });
        } catch (err) {
            this.listeners.delete(searchId);
            throw err;
        }
        return () => {
            this.listeners.delete(searchId);
            close();
        };
    }

    /** Every tab's open searches, for the leader's index worker. */
    list(): Promise<ReadonlyMap<string, string>> {
        return this.directory.list();
    }

    /** In the leader: which of the messages its index worker just wrote an open search matches. */
    reportMatches(searchId: string, { matched, unmatched }: Pick<ExpressionUpdates, 'matched' | 'unmatched'>) {
        const listener = this.listeners.get(searchId);
        if (listener) {
            listener.onUpdates({ matched, unmatched, removed: [] });
        } else {
            this.channel.post({ type: 'expressionUpdates', searchId, matched, unmatched });
        }
    }

    /** In the leader: deleted messages leave every tab's searches, whether or not they're among their results. */
    reportDeleted(ids: string[]) {
        if (ids.length === 0) {
            return;
        }
        this.deliverDeleted(ids);
        this.channel.post({ type: 'messagesDeleted', ids });
    }

    dispose() {
        this.unsubscribeFromChannel();
        this.listeners.clear();
    }

    private deliverDeleted(ids: string[]) {
        for (const listener of this.listeners.values()) {
            listener.onUpdates({ matched: [], unmatched: [], removed: ids });
        }
    }

    private handleTabMessage(message: TabMessage) {
        switch (message.type) {
            case 'expressionUpdates':
                this.listeners
                    .get(message.searchId)
                    ?.onUpdates({ matched: message.matched, unmatched: message.unmatched, removed: [] });
                break;
            case 'messagesDeleted':
                this.deliverDeleted(message.ids);
                break;
        }
    }
}
