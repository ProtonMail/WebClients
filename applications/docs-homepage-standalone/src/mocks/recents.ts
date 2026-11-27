import type { HomepageDependencies } from 'proton-docs/homepage';

const volumeId = 'volume';
const rootLinkId = 'root';

export const mimeTypes = { document: 'application/vnd.proton.doc', spreadsheet: 'application/vnd.proton.sheet' };

/** A folder in My files, under My files' root or the folder before it in a path. */
type Folder = { linkId: string; name: string };

/** A role on a node, as the Drive SDK's `MemberRole`. */
type Role = 'viewer' | 'editor' | 'admin';

/**
 * A file in My files, in its root or in the folders of `path`, outermost first, in the share of `shareId`. Or, with
 * `sharedBy`, a file that user shared with me directly, as an editor unless `role` says otherwise. With `trashed`,
 * it's in the trash.
 */
export type RecentFile = {
    linkId: string;
    name: string;
    type: keyof typeof mimeTypes;
    shareId?: string;
    path?: readonly Folder[];
    sharedBy?: string;
    role?: Role;
    trashed?: boolean;
    lastOpened?: Date;
};

type DriveEventListener = Parameters<HomepageDependencies['eventSubscriber']['initialize']>[1][number];
type DriveEvent = Parameters<DriveEventListener>[0];

/** The node UID of `linkId`, in the mocks' only volume. */
export function uid(linkId: string) {
    return `${volumeId}~${linkId}`;
}

// The fields of the Drive SDK's `NodeEntity` the homepage reads.
function node(
    linkId: string,
    {
        name,
        author = 'author@example.com',
        ...fields
    }: {
        name: string;
        author?: string;
        type: 'file' | 'folder';
        mediaType?: string;
        parentUid?: string;
        directRole?: string;
        membership?: { role: string };
    }
) {
    return {
        uid: uid(linkId),
        name: { ok: true, value: name },
        keyAuthor: { ok: true, value: author },
        directRole: 'admin',
        treeEventScopeId: 'scope',
        ...fields,
    };
}

function fileNode({ linkId, name, type, path = [], sharedBy, role }: RecentFile) {
    const mediaType = mimeTypes[type];
    if (sharedBy) {
        // Shared directly: the user holds a membership on it, and doesn't see its parent.
        return node(linkId, {
            name,
            author: sharedBy,
            type: 'file',
            mediaType,
            directRole: role ?? 'editor',
            membership: { role: role ?? 'editor' },
        });
    }
    return node(linkId, {
        name,
        type: 'file',
        mediaType,
        parentUid: uid(path.at(-1)?.linkId ?? rootLinkId),
        ...(role && { directRole: role }),
    });
}

// As the Drive SDK, whose iterators stop with an `AbortError` once their signal aborts.
function throwIfAborted(signal: AbortSignal | undefined) {
    if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
    }
}

function folderNodes(path: readonly Folder[]) {
    return path.map(({ linkId, name }, index) =>
        node(linkId, { name, type: 'folder', parentUid: uid(path[index - 1]?.linkId ?? rootLinkId) })
    );
}

/**
 * Dependencies that list `files` in the recents, opened at `lastOpened` or just now: the Docs API's recents, the
 * Drive nodes it points to, and Drive's events about them.
 */
export function recentsDependencies(
    files: RecentFile[]
): Pick<HomepageDependencies, 'api' | 'drive' | 'eventSubscriber'> {
    const root = node(rootLinkId, { name: 'root', type: 'folder' });
    const folders = new Map(files.flatMap(({ path = [] }) => folderNodes(path)).map((folder) => [folder.uid, folder]));
    let nodes = [root, ...folders.values(), ...files.map(fileNode)];
    const now = new Date();
    const trashedUids = new Set(files.filter(({ trashed }) => trashed).map(({ linkId }) => uid(linkId)));
    let eventListeners: DriveEventListener[] = [];
    const RecentDocuments = files.map(({ linkId, shareId = 'share', path = [], sharedBy, lastOpened = now }) => ({
        VolumeID: volumeId,
        LinkID: linkId,
        LastOpenTime: Math.floor(lastOpened.getTime() / 1000),
        ContextShareID: shareId,
        // Most immediate parent first, root last. A file shared directly is its share's root, so it has no ancestors
        // the user sees.
        AncestorIDs: sharedBy ? [] : [...path.map((folder) => folder.linkId).toReversed(), rootLinkId],
    }));

    async function* iterateNodes(uids: string[], signal?: AbortSignal) {
        throwIfAborted(signal);
        yield* nodes.filter((candidate) => uids.includes(candidate.uid));
    }
    function findNode(nodeUid: string | undefined) {
        return nodes.find((candidate) => candidate.uid === nodeUid);
    }
    // Drive tells the homepage about each changed node, whoever changed it.
    async function emitEvents(
        nodeUids: string[],
        event: { type: 'node_updated'; isTrashed: boolean } | { type: 'node_deleted' }
    ) {
        const events = nodeUids.map((nodeUid) => ({ ...event, nodeUid }) as DriveEvent);
        await Promise.all(events.flatMap((driveEvent) => eventListeners.map((listener) => listener(driveEvent))));
    }

    return {
        eventSubscriber: {
            initialize: async (_rootScope, listeners) => {
                eventListeners = listeners;
            },
            reset: () => {
                eventListeners = [];
            },
            subscribeToSharedDocument: () => {},
        },
        api: (async () => ({
            // The Docs API leaves trashed files out of the recents.
            RecentDocuments: RecentDocuments.filter(({ LinkID }) => !trashedUids.has(uid(LinkID))),
            Code: '1000',
        })) as unknown as HomepageDependencies['api'],
        drive: {
            getMyFilesRootFolder: async () => root,
            iterateNodes,
            iterateTrashedNodes: async function* (signal?: AbortSignal) {
                throwIfAborted(signal);
                yield* nodes.filter((candidate) => trashedUids.has(candidate.uid));
            },
            getNode: async (nodeUid: string) => nodes.find((candidate) => candidate.uid === nodeUid),
            // From My files' root to the node.
            getNodeHierarchy: async (nodeUid: string) => {
                const hierarchy = [];
                for (let current = findNode(nodeUid); current; current = findNode(current.parentUid)) {
                    hierarchy.unshift(current);
                }
                return hierarchy;
            },
            renameNode: async (nodeUid: string, newName: string) => {
                const renamed = nodes.find((candidate) => candidate.uid === nodeUid);
                if (renamed) {
                    renamed.name = { ok: true, value: newName };
                }
                await emitEvents([nodeUid], { type: 'node_updated', isTrashed: false });
            },
            trashNodes: async function* (nodeUids: string[]) {
                nodeUids.forEach((nodeUid) => trashedUids.add(nodeUid));
                yield* nodeUids.map((nodeUid) => ({ uid: nodeUid, ok: true }));
                await emitEvents(nodeUids, { type: 'node_updated', isTrashed: true });
            },
            restoreNodes: async function* (nodeUids: string[]) {
                nodeUids.forEach((nodeUid) => trashedUids.delete(nodeUid));
                yield* nodeUids.map((nodeUid) => ({ uid: nodeUid, ok: true }));
                await emitEvents(nodeUids, { type: 'node_updated', isTrashed: false });
            },
            deleteNodes: async function* (nodeUids: string[]) {
                nodes = nodes.filter((candidate) => !nodeUids.includes(candidate.uid));
                yield* nodeUids.map((nodeUid) => ({ uid: nodeUid, ok: true }));
                // Drive's event, for a deletion made elsewhere: the homepage's own deletion doesn't wait for it.
                await emitEvents(nodeUids, { type: 'node_deleted' });
            },
        } as unknown as HomepageDependencies['drive'],
    };
}
