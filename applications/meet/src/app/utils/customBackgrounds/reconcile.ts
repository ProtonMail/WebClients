import type { DriveBackground } from './drive/driveBackgrounds';
import type { CachedBackground } from './types';

export interface ReconciliationPlan {
    toFetch: DriveBackground[];
    toDelete: string[];
}

export const planReconciliation = ({
    cached,
    listed,
}: {
    cached: CachedBackground[];
    listed: DriveBackground[];
}): ReconciliationPlan => {
    const listedUids = new Set(listed.map(({ nodeUid }) => nodeUid));
    const cachedById = new Map(cached.map((background) => [background.id, background]));

    const toFetch: DriveBackground[] = [];
    const toDelete: string[] = [];

    for (const background of listed) {
        const record = cachedById.get(background.nodeUid);

        if (!record) {
            toFetch.push(background);
            continue;
        }

        // Dropped whole rather than patched: the cached image no longer belongs to the new revision.
        if (record.revisionUid !== background.revisionUid) {
            toDelete.push(record.id);
            toFetch.push(background);
        }
    }

    for (const record of cached) {
        if (!listedUids.has(record.id)) {
            toDelete.push(record.id);
        }
    }

    return { toFetch, toDelete: [...new Set(toDelete)] };
};
