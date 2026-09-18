import type { Entry } from '@proton/proton-foundation-search';

import { readSearchLibraryIntegerAttribute } from './entryAttributes';

/**
 * Recency of an index entry, in epoch-ms: the most recent of its creation, modification and
 * active-revision creation times.
 *
 * `modificationTime` alone is not a reliable content signal - the SDK documents it as "Modified on
 * server (renamed, moved, etc.)", not a content-touched timestamp. `activeRevisionCreationTime`
 * advances on every committed revision and is the more trustworthy "content changed" signal.
 * Taking the max of all three is the honest "most recent thing that provably happened to this
 * node", used as the eviction key: entries with the lowest recency are removed first.
 *
 * Missing/unreadable attributes contribute 0 (folders legitimately have
 * activeRevisionCreationTime = 0), so an entry with no readable timestamp sorts as oldest and is
 * evicted first - the right outcome for an unclassifiable entry.
 */
export function readEntryRecency(entry: Entry): number {
    const creationTime = readSearchLibraryIntegerAttribute(entry, 'creationTime') ?? 0;
    const modificationTime = readSearchLibraryIntegerAttribute(entry, 'modificationTime') ?? 0;
    const activeRevisionCreationTime = readSearchLibraryIntegerAttribute(entry, 'activeRevisionCreationTime') ?? 0;
    return Math.max(creationTime, modificationTime, activeRevisionCreationTime);
}
