import { traceError } from '@proton/shared/lib/helpers/sentry';

import { getDrive, getDriveForPhotos } from '../../../index';
import { logging } from '../../logging';

const logger = logging.getLogger('recently-accessed');

/** How long a node must stay previewed before it counts as accessed. */
export const RECENTLY_ACCESSED_PREVIEW_DELAY_MS = 10_000;

type Target = 'drive' | 'photos';

type RecentlyAccessedClient = {
    reportRecentlyAccessed(items: { nodeUid: string; accessTime?: Date }[]): Promise<void>;
};

/**
 * Reports nodes the user recently accessed so the server can build the
 * "recently accessed" list. Sends immediately while online; while offline,
 * nodes accumulate in memory until the browser is back online. A failed
 * send is dropped, not retried.
 *
 * The target (drive or photos endpoint) is picked by identity against the
 * current `getDrive()` / `getDriveForPhotos()` singletons. `start()` only
 * runs for the private app, so a client matching neither is a bug (e.g. a
 * client re-wrapped after `init()`) and is reported to Sentry.
 */
export class RecentlyAccessedReporter {
    private pendingByTarget: Record<Target, Map<string, Date>> = {
        drive: new Map(),
        photos: new Map(),
    };

    private started = false;

    constructor(
        private deps: {
            getDrive: () => RecentlyAccessedClient;
            getDriveForPhotos: () => RecentlyAccessedClient;
        }
    ) {}

    /**
     * Starts listening for the browser coming back online. Must be called
     * once, only for the private app: `report` is a no-op until this has
     * run, which keeps public pages silent even if a shared component
     * happens to pass a matching client.
     */
    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        window.addEventListener('online', this.handleOnline);
    }

    report(client: unknown, nodeUids: string[]): void {
        if (!this.started || nodeUids.length === 0) {
            return;
        }

        const target = this.getTarget(client);
        if (!target) {
            return;
        }

        const accessTime = new Date();
        const items = nodeUids.map((nodeUid) => ({ nodeUid, accessTime }));

        if (navigator.onLine) {
            this.send(target, items).catch(() => {});
        } else {
            this.enqueue(target, items);
        }
    }

    private getTarget(client: unknown): Target | undefined {
        if (client === this.deps.getDrive()) {
            return 'drive';
        }
        if (client === this.deps.getDriveForPhotos()) {
            return 'photos';
        }
        logger.warn('Recently accessed report called with an unrecognized client');
        return undefined;
    }

    private enqueue(target: Target, items: { nodeUid: string; accessTime: Date }[]): void {
        const pending = this.pendingByTarget[target];
        for (const { nodeUid, accessTime } of items) {
            pending.set(nodeUid, accessTime);
        }
    }

    private async send(target: Target, items: { nodeUid: string; accessTime: Date }[]): Promise<void> {
        const client = target === 'drive' ? this.deps.getDrive() : this.deps.getDriveForPhotos();
        try {
            await client.reportRecentlyAccessed(items);
        } catch (error) {
            logger.error('Failed to report recently accessed items', error);
            traceError(error, {
                level: 'error',
                tags: {
                    component: 'recently-accessed',
                },
            });
        }
    }

    private handleOnline = (): void => {
        for (const target of ['drive', 'photos'] as const) {
            const pending = this.pendingByTarget[target];
            if (pending.size === 0) {
                continue;
            }
            const items = Array.from(pending, ([nodeUid, accessTime]) => ({ nodeUid, accessTime }));
            pending.clear();
            this.send(target, items).catch(() => {});
        }
    };
}

export const recentlyAccessed = new RecentlyAccessedReporter({
    getDrive,
    getDriveForPhotos,
});
