import isNil from 'lodash/isNil';
import toposort from 'toposort';

import type { MessageFromApi, RemoteId, RemoteMessage } from '../remote/types';
import { isRemoteId } from '../types';

function topoSortMessages<T>(
    messages: T[],
    getId: (message: T) => RemoteId,
    getParentId: (message: T) => RemoteId | undefined | null
): T[] {
    // Validate IDs and ParentIDs
    for (const m of messages) {
        if (!isRemoteId(getId(m))) throw new Error('Invalid message ID');
        if (!isRemoteId(getParentId(m)) && !isNil(getParentId(m))) throw new Error('Invalid message ParentID');
    }

    // Create a map for quick lookup
    const map: Map<RemoteId, T> = new Map(messages.map((x) => [getId(x), x]));

    // Build the graph
    const graph: [RemoteId, RemoteId][] = messages
        .filter((m) => !isNil(getParentId(m)))
        .map((m) => [getParentId(m)!, getId(m)] satisfies [RemoteId, RemoteId]);

    // Perform topological sort
    const toposortedIds = toposort(graph);

    // Collect IDs that were not part of the graph (messages with no parent)
    const toposortedIdSet = new Set(toposortedIds);
    const allIdSet = new Set(map.keys());
    const remainingIdSet = new Set([...allIdSet].filter((id) => !toposortedIdSet.has(id)));

    // Combine sorted IDs with remaining IDs
    const sortedIds = [...toposortedIds, ...remainingIdSet];

    // Assertions to ensure correctness
    console.assert(sortedIds.length === messages.length, 'Topological sort failed (not returning as many values)');
    console.assert(
        messages.every((m) => sortedIds.includes(getId(m))),
        'Topological sort failed (not all inputs are included in output)'
    );
    console.assert(
        sortedIds.every((id1) => sortedIds.filter((id2) => id2 === id1).length === 1),
        'Topological sort failed (duplicate ids in output)'
    );

    // Map sorted IDs back to messages
    return sortedIds.map((id) => map.get(id)!);
}

export function topoSortRemoteMessages(remoteMessages: RemoteMessage[]): RemoteMessage[] {
    return topoSortMessages(
        remoteMessages,
        (rm) => rm.remoteId,
        (rm) => rm.remoteParentId
    );
}

export function topoSortMessagesFromApi(remoteMessages: MessageFromApi[]): MessageFromApi[] {
    return topoSortMessages(
        remoteMessages,
        (m) => m.ID as RemoteId,
        (m) => m.ParentID as RemoteId | undefined | null
    );
}
