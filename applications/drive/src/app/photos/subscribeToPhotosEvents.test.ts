import { NodeType, type ProtonDrivePhotosClient, getDriveForPhotos } from '@proton/drive';
import type { BusDriverClient, BusDriverEvent } from '@proton/drive/internal/BusDriver';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { subscribeToPhotosEvents } from './subscribeToPhotosEvents';
import { useAlbumsStore } from './useAlbums.store';
import type { PhotoItem } from './usePhotos.store';
import { usePhotosStore } from './usePhotos.store';

jest.mock('@proton/drive', () => ({
    ...jest.requireActual('@proton/drive'),
    getDriveForPhotos: jest.fn(),
}));

jest.mock('./loaders/loadAlbum', () => ({
    ...jest.requireActual('./loaders/loadAlbum'),
    loadCurrentAlbum: jest.fn(),
}));

// --- Constants ---

const PHOTOS_ROOT_UID = 'photos-root-uid';
const ALBUM_UID = 'album-node-uid';
const SHARED_ALBUM_UID = 'shared-album-node-uid';
const MY_PHOTOS_SCOPE_ID = 'my-photos-scope-id';

// --- Helpers ---

type CachedNode = {
    uid: string;
    type: NodeType.Photo | NodeType.Album;
    albumUids?: string[];
    isTrashed?: boolean;
    isShared?: boolean;
};

const photo = (uid: string, albumUids?: string[]): CachedNode => ({ uid, type: NodeType.Photo, albumUids });
const album = (uid: string): CachedNode => ({ uid, type: NodeType.Album });

// Declare all nodes that tests will ever need — mirrors the SDK in-memory cache
const KNOWN_NODES = [photo('photo-1'), photo('photo-2'), album(ALBUM_UID), album(SHARED_ALBUM_UID)];

const makePhotoItem = (uid: string, overrides?: Partial<PhotoItem>): PhotoItem => ({
    nodeUid: uid,
    captureTime: new Date(0),
    tags: [],
    relatedPhotoNodeUids: [],
    ...overrides,
});

const resetStores = () => {
    usePhotosStore.setState({
        photoTimelineUids: new Set(),
        photoItems: new Map(),
        isLoading: false,
        hasEverLoaded: false,
        eventSubscription: null,
        activeContexts: new Set(),
    });
    useAlbumsStore.setState({
        albums: new Map(),
        albumsUids: [],
        isLoadingList: false,
        hasEverLoadedList: false,
        currentAlbumNodeUid: undefined,
        isLoading: false,
        hasEverLoaded: false,
    });
};

// --- Node cache (simulates SDK in-memory cache) ---

const toMaybeNode = ({ uid, type, albumUids, isTrashed, isShared }: CachedNode) => {
    const baseNode = {
        uid,
        type,
        name: `node-${uid}`,
        creationTime: new Date(0),
        directRole: 'admin' as const,
        membership: undefined,
        ownedBy: { email: 'test@proton.ch' },
        deprecatedShareId: undefined,
        keyAuthor: { ok: true } as const,
        nameAuthor: { ok: true } as const,
        activeRevision: undefined,
        treeEventScopeId: type === NodeType.Album ? `${uid}-scope` : MY_PHOTOS_SCOPE_ID,
    };

    return {
        ok: true,
        value: {
            ...baseNode,
            photo:
                type === NodeType.Photo
                    ? {
                          captureTime: new Date(0),
                          tags: [],
                          relatedPhotoNodeUids: [],
                          albums: (albumUids ?? []).map((nodeUid) => ({ nodeUid, additionTime: new Date(0) })),
                      }
                    : undefined,
            album:
                type === NodeType.Album
                    ? { photoCount: 0, lastActivityTime: new Date(0), coverPhotoNodeUid: undefined }
                    : undefined,
            isTrashed,
            isShared,
        },
    } as unknown as Awaited<ReturnType<ProtonDrivePhotosClient['getMyPhotosRootFolder']>>;
};

const makeDrive = (nodes: CachedNode[] = [], rootUid = PHOTOS_ROOT_UID) => {
    const cache = new Map(nodes.map((n) => [n.uid, n]));
    return {
        getMyPhotosRootFolder: async () => ({
            ok: true,
            value: { uid: rootUid, treeEventScopeId: MY_PHOTOS_SCOPE_ID },
        }),
        getNode: async (uid: string) => toMaybeNode(cache.get(uid) ?? photo(uid)),
        getSharingInfo: async () => ({}),
    } as unknown as BusDriverClient;
};

// --- Setup ---

let unsubscribe: (() => void) | undefined;

beforeEach(async () => {
    jest.useFakeTimers();
    resetStores();
    (getDriveForPhotos as jest.Mock).mockReturnValue(makeDrive(KNOWN_NODES));
    unsubscribe = await subscribeToPhotosEvents();
});

afterEach(() => {
    unsubscribe?.();
    jest.useRealTimers();
});

const emit = async (event: BusDriverEvent, drive = makeDrive(KNOWN_NODES)) => {
    const emitPromise = getBusDriver().emit(event, drive);
    await jest.advanceTimersByTimeAsync(500);
    await emitPromise;
};

// --- Tests ---

describe('subscribeToPhotosEvents', () => {
    describe('CREATED_NODES (upload)', () => {
        it('photo uploaded → added to timeline', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(true);
            expect(usePhotosStore.getState().photoItems.get('photo-1')).toEqual(makePhotoItem('photo-1'));
        });

        it('album created → added to albums store', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });

            expect(useAlbumsStore.getState().albums.has(ALBUM_UID)).toBe(true);
            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.name).toBe(`node-${ALBUM_UID}`);
        });

        it('photo uploaded to shared album (undefined parentUid) → added to album', async () => {
            // Create the shared album (undefined parentUid since it's shared-with-me)
            await emit(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [{ uid: SHARED_ALBUM_UID, parentUid: undefined }],
                },
                makeDrive([album(SHARED_ALBUM_UID)])
            );

            // Photo created in that album — node data includes album membership
            await emit(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [{ uid: 'photo-1', parentUid: undefined }],
                },
                makeDrive([photo('photo-1', [SHARED_ALBUM_UID])])
            );

            expect(useAlbumsStore.getState().albums.get(SHARED_ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(true);
        });

        it('photo already in store → getNode still called to fetch attributes', async () => {
            let getNodeCallCount = 0;
            const countingDrive = makeDrive(KNOWN_NODES);
            countingDrive.getNode = async (uid: string) => {
                getNodeCallCount++;
                return toMaybeNode(photo(uid));
            };

            await emit(
                { type: BusDriverEventName.CREATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                countingDrive
            );
            const callsAfterFirst = getNodeCallCount;
            await emit(
                { type: BusDriverEventName.CREATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                countingDrive
            );

            expect(getNodeCallCount).toBe(callsAfterFirst + 1);
        });
    });

    describe('RESTORED_NODES', () => {
        it('photo restored → added to timeline', async () => {
            await emit({
                type: BusDriverEventName.RESTORED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(true);
            expect(usePhotosStore.getState().photoItems.get('photo-1')).toEqual(makePhotoItem('photo-1'));
        });

        it('album restored → added to albums store', async () => {
            await emit({
                type: BusDriverEventName.RESTORED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });

            expect(useAlbumsStore.getState().albums.has(ALBUM_UID)).toBe(true);
        });
    });

    describe('UPDATED_NODES — trashed', () => {
        it('timeline photo trashed → removed from timeline and photoItems', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID, isTrashed: true }],
            });

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(false);
            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
        });

        it('album photo trashed → removed from album and photoItems', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', [ALBUM_UID]), album(ALBUM_UID)])
            );
            await emit({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID, isTrashed: true }],
            });

            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(false);
        });

        it('photo trashed via album scope (undefined parentUid) → removed from album but kept in timeline', async () => {
            // Set up shared album and photo in timeline
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: SHARED_ALBUM_UID, parentUid: PHOTOS_ROOT_UID, isShared: true }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            // Add photo to shared album
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: undefined }] },
                makeDrive([photo('photo-1', [SHARED_ALBUM_UID]), album(SHARED_ALBUM_UID)])
            );
            // Trash event comes with undefined parentUid (album scope) — should only remove from album
            await emit({
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: 'photo-1', parentUid: undefined, isTrashed: true }],
            });

            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(true);
            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(true);
            expect(useAlbumsStore.getState().albums.get(SHARED_ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(false);
        });
    });

    describe('UPDATED_NODES — album membership changes', () => {
        it('photo added to album → added to album store', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', [ALBUM_UID]), album(ALBUM_UID)])
            );

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(true);
            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(true);
        });

        it('photo removed from album → removed from album store but kept in timeline', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', [ALBUM_UID]), album(ALBUM_UID)])
            );
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', []), album(ALBUM_UID)])
            );

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(true);
            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(false);
        });

        it('photo removed from shared album (undefined parentUid) → removed from shared album store', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: SHARED_ALBUM_UID, parentUid: PHOTOS_ROOT_UID, isShared: true }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            // Add photo to shared album
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: undefined }] },
                makeDrive([photo('photo-1', [SHARED_ALBUM_UID]), album(SHARED_ALBUM_UID)])
            );
            // Remove photo from shared album — node no longer lists the album
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: undefined }] },
                makeDrive([photo('photo-1', []), album(SHARED_ALBUM_UID)])
            );

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(true);
            expect(useAlbumsStore.getState().albums.get(SHARED_ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(false);
        });

        it('photo added to multiple albums → synced to all matching albums', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [
                    { uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID },
                    { uid: SHARED_ALBUM_UID, parentUid: PHOTOS_ROOT_UID },
                ],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', [ALBUM_UID, SHARED_ALBUM_UID]), album(ALBUM_UID), album(SHARED_ALBUM_UID)])
            );

            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(true);
            expect(useAlbumsStore.getState().albums.get(SHARED_ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(true);
        });
    });

    describe('DELETED_NODES', () => {
        it('photo deleted → removed from timeline and photoItems', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({ type: BusDriverEventName.DELETED_NODES, uids: ['photo-1'] });

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(false);
            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
        });

        it('photo deleted → removed from all albums', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', [ALBUM_UID]), album(ALBUM_UID)])
            );
            await emit({ type: BusDriverEventName.DELETED_NODES, uids: ['photo-1'] });

            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(false);
        });
    });

    describe('TRASHED_NODES', () => {
        it('photo trashed → removed from timeline and photoItems', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({ type: BusDriverEventName.TRASHED_NODES, uids: ['photo-1'] });

            expect(usePhotosStore.getState().photoTimelineUids.has('photo-1')).toBe(false);
            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
        });

        it('photo trashed → removed from all albums', async () => {
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: ALBUM_UID, parentUid: PHOTOS_ROOT_UID }],
            });
            await emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }],
            });
            await emit(
                { type: BusDriverEventName.UPDATED_NODES, items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID }] },
                makeDrive([photo('photo-1', [ALBUM_UID]), album(ALBUM_UID)])
            );
            await emit({ type: BusDriverEventName.TRASHED_NODES, uids: ['photo-1'] });

            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
            expect(useAlbumsStore.getState().albums.get(ALBUM_UID)?.photoNodeUids?.has('photo-1')).toBe(false);
        });
    });

    describe('Edge cases', () => {
        it('event with isTrashed=true skips getNode call', async () => {
            let getNodeCallCount = 0;
            const countingDrive = makeDrive(KNOWN_NODES);
            countingDrive.getNode = async (uid: string) => {
                getNodeCallCount++;
                return toMaybeNode(photo(uid));
            };

            await emit(
                {
                    type: BusDriverEventName.UPDATED_NODES,
                    items: [{ uid: 'photo-1', parentUid: PHOTOS_ROOT_UID, isTrashed: true }],
                },
                countingDrive
            );

            expect(getNodeCallCount).toBe(0);
            expect(usePhotosStore.getState().photoItems.has('photo-1')).toBe(false);
        });

        it('node without photo/album attributes → not added to store', async () => {
            const brokenDrive = {
                ...makeDrive([]),
                getNode: async () => ({
                    ok: true,
                    value: {
                        uid: 'broken-node',
                        type: NodeType.Photo,
                        photo: undefined,
                        album: undefined,
                        name: 'broken',
                        creationTime: new Date(0),
                        directRole: 'admin',
                        membership: undefined,
                        ownedBy: { email: 'test@proton.ch' },
                        deprecatedShareId: undefined,
                        keyAuthor: { ok: true },
                        nameAuthor: { ok: true },
                        activeRevision: undefined,
                        treeEventScopeId: MY_PHOTOS_SCOPE_ID,
                    },
                }),
            } as unknown as BusDriverClient;

            await emit(
                { type: BusDriverEventName.CREATED_NODES, items: [{ uid: 'broken-node', parentUid: PHOTOS_ROOT_UID }] },
                brokenDrive
            );

            expect(usePhotosStore.getState().photoTimelineUids.has('broken-node')).toBe(false);
        });
    });
});
