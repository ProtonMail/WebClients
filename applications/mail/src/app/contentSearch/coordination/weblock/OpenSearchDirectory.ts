import type { OpenSearchDirectory as OpenSearchDirectoryInterface } from '../OpenSearchDirectory';

/**
 * {@link OpenSearchDirectoryInterface} on Web Locks: each open search holds a lock named after its id and expression,
 * which the leader lists with `query()`. A tab that closes or crashes releases its locks, so no search outlives its tab,
 * and a page holding a lock isn't put in the back/forward cache, so a listed search never misses updates.
 */
export class OpenSearchDirectory implements OpenSearchDirectoryInterface {
    private readonly prefix: string;

    constructor(
        userId: string,
        // eslint-disable-next-line compat/compat -- content search requires Safari 15.4+
        private readonly locks: LockManager = navigator.locks
    ) {
        this.prefix = `content-search:${userId}:open-search:`;
    }

    /** `searchId` must not contain `:`, which separates it from the expression in the lock name. */
    async open(searchId: string, expression: string, _onMissedUpdates: () => void): Promise<() => void> {
        let release!: () => void;
        const released = new Promise<void>((resolve) => {
            release = resolve;
        });
        // once granted, the request only settles after the release, so a rejection can only come before the grant
        await new Promise<void>((granted, failed) => {
            this.locks
                .request(`${this.prefix}${searchId}:${expression}`, () => {
                    granted();
                    return released;
                })
                .catch(failed);
        });
        return release;
    }

    async list(): Promise<ReadonlyMap<string, string>> {
        const { held = [] } = await this.locks.query();
        const searches = new Map<string, string>();
        for (const { name } of held) {
            if (!name?.startsWith(this.prefix)) {
                continue;
            }
            const rest = name.slice(this.prefix.length);
            const separator = rest.indexOf(':');
            if (separator !== -1) {
                searches.set(rest.slice(0, separator), rest.slice(separator + 1));
            }
        }
        return searches;
    }
}
